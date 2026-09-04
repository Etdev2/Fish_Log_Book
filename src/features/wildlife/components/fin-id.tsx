"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { TraitFigure, type TraitFigureKey } from "@/components/trait-figure";
import { identify } from "@/core/rules/identification/identify";
import type { Candidate } from "@/core/rules/identification/types";

import { FIN_ID_PACK, VIEWING_GUIDANCE } from "../fin-id-pack";

/**
 * Fin ID — whales, dolphins and porpoises (passport spec §17, §20, §21).
 *
 * The rockfish wizard's sibling, on the same engine, with one deliberate difference in
 * posture: that screen helps decide whether to keep a fish, and this one never does.
 * Every animal here is protected, so the standing advice is a distance, not a verdict —
 * NOAA's guidance sits at the top of the screen before any answer is given, not as a
 * footnote after the app has told someone what they are looking at (§21).
 *
 * Nothing here rewards getting closer. The questions are written to be answerable from
 * 100 yards, which is where the law requires the boat to stay.
 */
const FOCUS =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

export function FinId() {
  const [chosen, setChosen] = useState<readonly string[]>([]);

  const reading = useMemo(() => identify(FIN_ID_PACK, chosen), [chosen]);
  const top = reading.candidates[0];
  const confident = reading.ranked && top !== undefined && top.sharePct >= 40;

  function toggle(questionId: string, optionId: string) {
    const question = FIN_ID_PACK.questions.find((q) => q.id === questionId);
    const siblings = new Set(question?.options.map((o) => o.id) ?? []);
    setChosen((prev) => {
      // One answer per question, and tapping the chosen one again means "not sure" again.
      const withoutQuestion = prev.filter((id) => !siblings.has(id));
      return prev.includes(optionId) ? withoutQuestion : [...withoutQuestion, optionId];
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Whale &amp; dolphin ID</h1>
        <p className="mt-1 text-caption text-text-muted">
          Answer what you saw. &quot;Not sure&quot; is always fine — skip the question. This
          narrows the field; it never certifies an animal.
        </p>
      </section>

      {/* §21: the distance comes before anything the app has to say about the animal. */}
      <p
        role="note"
        className="rounded-md border border-tide-cyan bg-surface p-4 text-body text-text-primary"
      >
        Stay <strong>100 yards</strong> from whales and <strong>50 yards</strong> from
        dolphins, porpoises and seals. If one approaches you, put the engine in neutral and
        let it pass. Never chase, circle or feed them — all of these animals are protected.
      </p>

      {FIN_ID_PACK.questions.map((question) => (
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
            ? "What you might be looking at"
            : confident
              ? `Likely ${top.profile.commonName.toLowerCase()}`
              : "Not enough to say yet"}
        </h2>

        {chosen.length > 0 && !confident ? (
          <p className="mt-2 text-caption text-text-muted">
            {reading.reason ?? "Still too broad."} Watch for one more mark — the fin shape and
            the blow separate most of these.
          </p>
        ) : null}

        <ul className="mt-3 flex flex-col gap-3">
          {reading.candidates.slice(0, 4).map((candidate) => (
            <CandidateRow key={candidate.profile.speciesId} candidate={candidate} />
          ))}
        </ul>
      </section>

      <p className="text-caption text-text-muted">
        Seen an animal that is entangled, injured or stranded? Call the NOAA Marine Mammal
        Stranding hotline on 1-877-WHALE-HELP. Do not enter the water or try to help it
        yourself.
      </p>

      <Link
        href="/fish-legal"
        className={`inline-flex min-h-touch-floor items-center text-label text-text-link ${FOCUS}`}
      >
        ← Back to Legal
      </Link>
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: Candidate }) {
  const [open, setOpen] = useState(false);
  const { profile, sharePct } = candidate;
  const guidance = VIEWING_GUIDANCE[profile.speciesId];

  return (
    <li className="rounded-md border border-hairline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 p-3 text-left ${FOCUS}`}
      >
        <span className="flex-1">
          <span className="text-body font-semibold">{profile.commonName}</span>
          <span className="block text-caption italic text-text-muted">
            {profile.scientificName}
          </span>
          {guidance?.status === "endangered" ? (
            <span className="block text-caption text-amber-flag">Endangered</span>
          ) : null}
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
              {candidate.against.length > 0
                ? ` Counts against: ${candidate.against.join(", ")}.`
                : ""}
            </p>
          ) : null}

          {guidance !== undefined ? (
            <p className="text-caption text-text-muted">
              Keep at least {guidance.distanceYards} yards away.
              {guidance.reportUrl !== undefined
                ? " NOAA wants sightings of this one reported."
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
