"use client";

import { LegalNotice } from "@/components/legal-notice";
import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TraitFigure, isPicture, type TraitFigureKey } from "@/components/trait-figure";
import { identify } from "@/core/rules/identification/identify";
import type { Candidate, TraitPack } from "@/core/rules/identification/types";

/**
 * One trait pack, asked and answered (spec §17).
 *
 * Generic on purpose: a new fish family is a data file, and this screen never learns its
 * name. The marine mammal screen stays separate because its posture is different — that
 * one is about keeping your distance, this one is about whether the fish can go in the
 * box, so it carries the release warning and the link into Fish Legal instead.
 */
const FOCUS =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

export function PackWizard({ pack }: { pack: TraitPack }) {
  const [chosen, setChosen] = useState<readonly string[]>([]);

  const reading = useMemo(() => identify(pack, chosen), [pack, chosen]);
  const top = reading.candidates[0];
  const confident = reading.ranked && top !== undefined && top.sharePct >= 40;

  function toggle(questionId: string, optionId: string) {
    const siblings = new Set(
      pack.questions.find((q) => q.id === questionId)?.options.map((o) => o.id) ?? [],
    );
    setChosen((prev) => {
      const cleared = prev.filter((id) => !siblings.has(id));
      return prev.includes(optionId) ? cleared : [...cleared, optionId];
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/fish-id" label="Fish ID" />

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">{pack.name}</h1>
        <p className="mt-1 text-caption text-text-muted">
          Look at your fish and tap what you see. Not sure? Skip it. This helps you guess
          the fish; it can be wrong.
        </p>
        <div className="mt-3">
          <LegalNotice kind="identification" />
        </div>
      </section>

      {/* §4.6: a protected candidate is worth a banner before it is worth a ranking. */}
      {reading.restricted.length > 0 ? (
        <p
          role="alert"
          className="rounded-md border border-amber-flag bg-surface p-4 text-body font-semibold text-amber-flag"
        >
          Could be {reading.restricted.map((c) => c.profile.commonName).join(" or ")} — no
          take at any time. If there is any doubt, put it back in the water.
        </p>
      ) : null}

      {pack.questions.map((question) => {
        /*
         * Founder, 2026-10-16: "a five-year-old understands it". When every answer has a
         * colour picture, the answers ARE the pictures: big cards, two to a row, the words
         * underneath. Otherwise the answers are full-width buttons, one per line, so a long
         * label never wraps beside a short one.
         */
        const pictures = question.options.every(
          (option) => option.figure !== undefined && isPicture(option.figure as TraitFigureKey),
        );
        return (
          <section key={question.id} className="rounded-lg border border-hairline bg-surface p-4">
            <h2 className="text-h3">{question.question}</h2>
            <div className={`mt-3 grid gap-3 ${pictures ? "grid-cols-2" : "grid-cols-1"}`}>
              {question.options.map((option) => {
                const on = chosen.includes(option.id);
                if (pictures) {
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggle(question.id, option.id)}
                      aria-pressed={on}
                      className={`relative flex flex-col items-stretch gap-2 rounded-lg border-2 p-2 text-center transition-colors ${FOCUS} active:scale-95 motion-reduce:transition-none ${
                        on ? "border-signal-orange bg-surface-raised" : "border-hairline bg-background"
                      }`}
                    >
                      <span className="block overflow-hidden rounded-md bg-surface-raised p-1">
                        <TraitFigure figure={option.figure as TraitFigureKey} size="card" />
                      </span>
                      <span className={`text-label ${on ? "text-text-primary" : "text-text-link"}`}>
                        {option.label}
                      </span>
                      {on ? (
                        <span
                          aria-hidden
                          className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-signal-orange text-label text-ink-on-orange"
                        >
                          ✓
                        </span>
                      ) : null}
                    </button>
                  );
                }
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggle(question.id, option.id)}
                    aria-pressed={on}
                    className={`flex min-h-touch-floor items-center gap-3 rounded-lg border-2 px-4 py-2 text-left text-label transition-colors ${FOCUS} active:scale-95 motion-reduce:transition-none ${
                      on
                        ? "border-signal-orange bg-surface-raised text-text-primary"
                        : "border-hairline bg-background text-text-link"
                    }`}
                  >
                    {option.figure !== undefined ? (
                      <TraitFigure figure={option.figure as TraitFigureKey} />
                    ) : null}
                    <span className="flex-1">{option.label}</span>
                    {on ? (
                      <span aria-hidden className="text-signal-orange">
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="rounded-lg border border-hairline bg-surface p-4" aria-live="polite">
        <h2 className="text-h3">
          {chosen.length === 0
            ? "Possible matches"
            : confident
              ? `Likely ${top.profile.commonName.toLowerCase()}`
              : "Not enough to say yet"}
        </h2>

        {chosen.length > 0 && !confident ? (
          <p className="mt-2 text-caption text-text-muted">
            {reading.reason ?? "Still too broad."} If it could be a protected fish, release
            wins — a fish returned is never a ticket.
          </p>
        ) : null}

        <ul className="mt-3 flex flex-col gap-3">
          {reading.candidates.slice(0, 4).map((candidate) => (
            <CandidateRow key={candidate.profile.speciesId} candidate={candidate} />
          ))}
        </ul>

        <p className="mt-4 text-caption text-text-muted">
          Limits and seasons change. Check the rules where you are before you keep anything.
        </p>
        <Link
          href="/fish-legal"
          className={`mt-2 inline-flex min-h-touch-floor items-center text-label text-text-link ${FOCUS}`}
        >
          Open Fish Legal →
        </Link>
      </section>

      <p className="text-caption text-text-muted">Source: {pack.source}</p>
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: Candidate }) {
  const [open, setOpen] = useState(false);
  const { profile, sharePct } = candidate;

  return (
    <li className="rounded-md border border-hairline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 p-3 text-left ${FOCUS}`}
      >
        <span className="flex-1">
          <span className="text-body font-semibold">
            {profile.commonName}
            {profile.noRetention ? " · RELEASE ONLY" : ""}
          </span>
          <span className="block text-caption italic text-text-muted">{profile.scientificName}</span>
        </span>
        <span className="text-label text-text-muted">{sharePct}%</span>
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t border-hairline p-3">
          <ul className="flex flex-col gap-1 text-caption">
            {profile.keyFeatures.map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
          {candidate.supporting.length > 0 || candidate.against.length > 0 ? (
            <p className="text-caption text-text-muted">
              {candidate.supporting.length > 0
                ? `Matches what you said: ${candidate.supporting.join(", ")}.`
                : ""}
              {candidate.against.length > 0 ? ` Counts against: ${candidate.against.join(", ")}.` : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
