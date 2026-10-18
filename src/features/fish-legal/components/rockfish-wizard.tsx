"use client";

import { LegalNotice } from "@/components/legal-notice";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  CHIP_CLASS,
  CHIP_OFF,
  CHIP_ON,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/features/catches/ui-classes";
import {
  hasVerifiedRules,
  ID_QUESTIONS,
  identifyRockfish,
  identifyRockfishFully,
  restrictedIn,
  type IdCandidate,
  type TraitAnswer,
} from "../rockfish-id";
import { speciesDisplayName } from "../reg-species";
import { idPhoto } from "../species-photos";
import { CandidateCard } from "./candidate-card";
import { matchBand, STRONG_SHARE_PCT } from "@/core/rules/identification/identify";
import type { Identification } from "@/core/rules/identification/types";

/**
 * Identify a Rockfish (founder spec §5): plain-worded visual questions, live narrowing,
 * CONFIDENCE language ("Likely vermilion rockfish — 48%"), and the §6 hard rule: any
 * prohibited species above the warning floor gets the amber "Possible Restricted
 * Species" banner, and the closing advice always favors release when uncertain.
 *
 * Wizard, not form: one question per screen would fit a gloved hand better, but a
 * two-column sheet with the live answer-list updating in place answers faster and keeps
 * all six questions thumbed-in-reach. A "Not sure" tile exists on every question and
 * simply doesn't narrow — nothing is required except honesty.
 */
export function RockfishWizard() {
  const [answers, setAnswers] = useState<Record<string, TraitAnswer | null>>({});
  const chosen = useMemo(
    () => Object.values(answers).filter((a): a is TraitAnswer => a !== null),
    [answers],
  );
  const candidates = useMemo(() => identifyRockfish(chosen), [chosen]);
  const restricted = useMemo(() => restrictedIn(candidates), [candidates]);
  const top = candidates[0];
  /*
   * The engine's own §4.5 judgement, not a second opinion invented here. It refuses to
   * name a winner off one answer, or when the top two are within ten points — a 31/29
   * split is a coin toss wearing a rosette, and this screen exists to stop someone
   * keeping the wrong fish on one.
   */
  const reading = useMemo(() => identifyRockfishFully(chosen), [chosen]);
  const confidentEnough = reading.ranked && top && top.confidencePct >= STRONG_SHARE_PCT;
  // Every picture until something is answered, then the four likeliest (see pack-wizard).
  const shown = chosen.length === 0 ? candidates : candidates.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Identify a rockfish</h1>
        <p className="mt-1 text-caption text-text-muted">
          Answer what you can see, or find the picture that looks like your fish. &quot;Not
          sure&quot; is always fine — it just doesn&rsquo;t rule anything out. A best match
          narrows the field; it never proves it.
        </p>
        <div className="mt-3">
          <LegalNotice kind="identification" />
        </div>
      </section>

      {restricted.length > 0 ? (
        <p role="alert" className="rounded-md border border-amber-flag bg-surface p-4 text-body font-semibold text-amber-flag">
          Possible restricted species — verify before retaining.{" "}
          {restricted.map((c) => c.profile.commonName).join(", ")} cannot be kept at any
          time in California.
        </p>
      ) : null}

      {ID_QUESTIONS.map((q) => (
        <fieldset key={q.id} className="rounded-lg border border-hairline bg-surface p-4">
          <legend className="text-h3">{q.question}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {q.answers.map((a) => {
              const selected = answers[q.id] === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: selected ? null : a.id }))}
                  className={`${CHIP_CLASS} ${selected ? CHIP_ON : CHIP_OFF}`}
                >
                  {a.label}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={answers[q.id] === null}
              onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: null }))}
              className={`${CHIP_CLASS} ${answers[q.id] == null ? CHIP_ON : CHIP_OFF}`}
            >
              Not sure
            </button>
          </div>
        </fieldset>
      ))}

      <section className="rounded-lg border border-hairline bg-surface p-4" aria-live="polite">
        <h2 className="text-h3">
          {chosen.length === 0
            ? "Which one looks like your fish?"
            : confidentEnough
              ? `Best match: ${top.profile.commonName}`
              : "Still wide open"}
        </h2>
        <ul className="mt-3 flex flex-col gap-4">
          {shown.map((c) => (
            <CandidateRow
              key={c.profile.speciesId}
              candidate={c}
              reading={reading}
              answered={chosen.length}
            />
          ))}
        </ul>
        <Link
          href="/fish-legal/rockfish/catalog"
          className="mt-3 inline-flex min-h-touch-floor items-center text-label text-text-link underline decoration-dotted underline-offset-4"
        >
          See every rockfish with pictures →
        </Link>
        {chosen.length > 0 && !confidentEnough ? (
          <p className="mt-3 text-caption text-text-muted">
            {reading.reason ?? "No clear read yet."} If the fish could be a restricted
            species, release wins — a fish returned is never a ticket.
          </p>
        ) : null}
        <Link href="/fish-legal/boundaries" className="mt-4 inline-flex min-h-touch-floor items-center text-label text-text-link underline decoration-dotted underline-offset-4">
          Now check where you&rsquo;re standing →
        </Link>
      </section>
    </div>
  );
}

function CandidateRow({
  candidate,
  reading,
  answered,
}: {
  candidate: IdCandidate;
  reading: Identification;
  answered: number;
}) {
  const { profile } = candidate;
  return (
    <CandidateCard
      name={profile.commonName}
      scientificName={profile.scientificName}
      noRetention={profile.noRetention}
      photo={idPhoto(profile.speciesId)}
      band={matchBand(reading, profile.speciesId, answered)}
    >
      <ul className="flex flex-col gap-1 text-body">
        {profile.keyFeatures.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      {/* §4.7: a ranking an angler cannot check against the fish is worse than none. */}
      {candidate.supporting.length > 0 || candidate.against.length > 0 ? (
        <p className="text-caption text-text-muted">
          {candidate.supporting.length > 0
            ? `Matches what you said: ${candidate.supporting.join(", ")}.`
            : ""}
          {candidate.against.length > 0 ? ` Counts against: ${candidate.against.join(", ")}.` : ""}
        </p>
      ) : null}
      <p className="text-caption text-text-muted">
        Easily confused with: {profile.similarTo.map(speciesDisplayName).join(", ")} —
        compare them before you keep.
      </p>
      {hasVerifiedRules(profile.speciesId) ? (
        <Link
          href={`/fish-legal/species/${profile.speciesId}`}
          className={`${SECONDARY_BUTTON} self-start`}
        >
          {profile.noRetention ? "Why it must go back" : "Current limits for this fish"}
        </Link>
      ) : null}
      <p className="text-caption text-text-muted">
        Pictures are CDFW identification drawings. Check against the CDFW rockfish guide
        (linked on its rules card) before you keep.
      </p>
    </CandidateCard>
  );
}

export function RockfishWizardActions({ onReset }: { onReset: () => void }) {
  return (
    <button type="button" onClick={onReset} className={PRIMARY_BUTTON}>
      Start over
    </button>
  );
}
