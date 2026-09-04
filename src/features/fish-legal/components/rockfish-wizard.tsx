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
  type RockfishProfile,
  type TraitAnswer,
} from "../rockfish-id";
import { speciesDisplayName } from "../reg-species";

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
  const confidentEnough = reading.ranked && top && top.confidencePct >= 40;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Identify a rockfish</h1>
        <p className="mt-1 text-caption text-text-muted">
          Answer what you can see. &quot;Not sure&quot; is a legal answer everywhere — it just
          doesn&rsquo;t eliminate anything. Match percentages narrow the field; they never
          certify it.
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
            ? "Possible matches"
            : confidentEnough
              ? `Likely ${top.profile.commonName.toLowerCase()}`
              : "Still wide open"}
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          {candidates.slice(0, 4).map((c) => (
            <CandidateRow key={c.profile.speciesId} candidate={c} />
          ))}
        </ul>
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

function CandidateRow({ candidate }: { candidate: IdCandidate }) {
  const { profile, confidencePct } = candidate;
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-md border border-hairline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <Swatch profile={profile} />
        <span className="flex-1">
          <span className="text-body font-semibold">
            {profile.commonName}
            {profile.noRetention ? " · RELEASE ONLY" : ""}
          </span>
          <span className="block text-caption text-text-muted italic">{profile.scientificName}</span>
        </span>
        <span className="text-label text-text-muted">{confidencePct}%</span>
      </button>
      {open ? (
        <div className="flex flex-col gap-3 border-t border-hairline p-3">
          <ul className="flex flex-col gap-1 text-caption">
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
              {candidate.against.length > 0
                ? ` Counts against: ${candidate.against.join(", ")}.`
                : ""}
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
            Visuals are schematic, not photos. Positive ID against the CDFW rockfish ID
            guides (linked on its rules card).
          </p>
        </div>
      ) : null}
    </li>
  );
}

/** Honest schematic swatch: the fish's general color story, rendered as blocks. */
function Swatch({ profile }: { profile: RockfishProfile }) {
  const { base, accent, pattern } = profile.swatch;
  const spots = pattern === "spots";
  return (
    <svg
      viewBox="0 0 44 28"
      aria-hidden
      className="h-10 w-14 shrink-0 rounded"
      style={{ background: base }}
    >
      {spots
        ? [8, 16, 24, 32].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 9 : 17} r="2.2" fill={accent} />
          ))
        : pattern === "blotches"
          ? [6, 18, 30].map((x) => (
              <ellipse key={x} cx={x} cy={x % 2 ? 10 : 18} rx="4" ry="2.6" fill={accent} />
            ))
          : <rect x="0" y="20" width="44" height="8" fill={accent} opacity="0.55" />}
    </svg>
  );
}

export function RockfishWizardActions({ onReset }: { onReset: () => void }) {
  return (
    <button type="button" onClick={onReset} className={PRIMARY_BUTTON}>
      Start over
    </button>
  );
}
