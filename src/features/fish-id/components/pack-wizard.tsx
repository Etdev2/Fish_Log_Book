"use client";

import { LegalNotice } from "@/components/legal-notice";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TraitFigure, type TraitFigureKey } from "@/components/trait-figure";
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
      <nav>
        <Link href="/fish-id" className={`inline-flex min-h-touch-floor items-center text-label text-text-link ${FOCUS}`}>
          ← Fish ID
        </Link>
      </nav>

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">{pack.name}</h1>
        <p className="mt-1 text-caption text-text-muted">
          Answer what you can see. Skip anything you are unsure of — that is a real answer
          and it costs you nothing. This narrows the field; it never certifies a fish.
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

      {pack.questions.map((question) => (
        <section key={question.id} className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">{question.question}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {question.options.map((option) => {
              const on = chosen.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(question.id, option.id)}
                  aria-pressed={on}
                  className={`flex min-h-touch-floor items-center gap-2 rounded-full border px-4 text-label transition-colors ${FOCUS} active:scale-95 motion-reduce:transition-none ${
                    on
                      ? "border-signal-orange bg-signal-orange text-ink-on-orange"
                      : "border-border-interactive bg-surface text-text-link"
                  }`}
                >
                  {/* Drawn in currentColor, so it reads on the chip whether it is selected or not. */}
                  {option.figure !== undefined ? (
                    <TraitFigure figure={option.figure as TraitFigureKey} />
                  ) : null}
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>
      ))}

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
