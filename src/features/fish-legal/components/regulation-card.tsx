"use client";

import type { RegulationCard as RegulationCardData } from "../types";

// Spec §5 legal-status words, chosen from the verdict + the reason grammar so the
// banner says the KIND of "no" (season vs prohibition vs slot-check) in plain English.
function statusWord(card: RegulationCardData): { word: string; tone: string; tail: string } {
  const reason = card.verdictReason.toLowerCase();
  if (card.verdict === "keep") {
    return {
      word: "LEGAL TO KEEP",
      tone: "bg-success-green text-ink-on-orange",
      tail: "Open today, with the limits below.",
    };
  }
  if (card.verdict === "conditional") {
    return {
      word: "SPECIAL REGULATIONS APPLY",
      tone: "bg-amber-flag text-ink-on-orange",
      tail: "Something real can flip this — read the reason.",
    };
  }
  if (reason.includes("season")) {
    return {
      word: "SEASON CLOSED",
      tone: "bg-error-red-fill text-text-primary",
      tail: "Closed today. Handle quickly, revive, release.",
    };
  }
  return {
    word: "CATCH & RELEASE ONLY",
    tone: "bg-error-red-fill text-text-primary",
    tail: "Put it back. Gentle handling, get the air out, get it down.",
  };
}

/**
 * The verdict card (founder spec §4 + §15): the answer in two seconds, then limits,
 * then law. Verdict is a color AND a word because color alone fails a color-blind
 * angler in bright sun (spec §15's "clear status colors/icons" plus accessibility
 * non-negotiables).
 *
 * §23 is structural here: staleness is rendered with every card that earns it, not
 * hidden in a settings screen; the official source link is on every card, fresh or not.
 */
export function RegulationCard({ card }: { card: RegulationCardData }) {
  const v = statusWord(card);
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-4">
      <div className={`rounded-md px-4 py-3 ${v.tone}`}>
        <p className="text-h2 font-bold tracking-wide">{v.word}</p>
        <p className="mt-1 text-caption">{card.verdictReason}</p>
      </div>

      {card.isStale ? (
        <p role="alert" className="rounded-md border border-amber-flag p-3 text-caption text-amber-flag">
          Regulations last verified {card.staleDays} days ago ({card.verifiedAt}). Verify
          current rules with the CDFW source below before retaining fish.
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-3">
        <Fact label="Daily limit" value={card.bagDaily === null ? "None listed" : String(card.bagDaily)} />
        {card.possessionLimit !== null && card.possessionLimit !== card.bagDaily ? (
          <Fact label="Possession limit" value={String(card.possessionLimit)} />
        ) : null}
        <Fact
          label={card.maxSizeIn !== null ? "Slot limit" : "Minimum size"}
          value={
            card.minSizeIn === null
              ? "None"
              : card.maxSizeIn !== null
                ? `${card.minSizeIn}–${card.maxSizeIn}″ ${card.sizeMeasure === "fork_length" ? "fork length" : card.sizeMeasure === "alternate_total_length" ? "alternate length" : "total length"}`
                : `${card.minSizeIn}″ ${card.sizeMeasure === "fork_length" ? "fork length" : card.sizeMeasure === "alternate_total_length" ? "alternate length" : "total length"}`
          }
        />
        <Fact label="Season" value={card.seasonText} />
        {card.depthText ? <Fact label="Depth / boundary" value={card.depthText} /> : null}
      </dl>

      {card.groupNote ? (
        <p className="text-caption text-text-muted">
          Shared bag: {card.groupNote}
        </p>
      ) : null}

      {card.specialRules.length > 0 ? (
        <div className="rounded-md border border-hairline p-3">
          <p className="text-label text-text-muted">Special rules in play</p>
          <ul className="mt-2 flex flex-col gap-2 text-caption">
            {card.specialRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className="rounded-md border border-hairline p-3">
        <summary className="cursor-pointer text-label text-text-link">
          View official rule — {card.sourceTitle}
        </summary>
        <p className="mt-2 text-caption text-text-muted">
          {v.tail} Source updated {card.sourceUpdatedAt ?? "not stamped by source"} ·
          verified {card.verifiedAt} · pack v{card.packVersion}.
        </p>
        <a
          href={card.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-touch-floor items-center rounded-md text-label text-text-link underline decoration-dotted underline-offset-4"
        >
          Open the official source ↗
        </a>
      </details>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-caption text-text-muted">{label}</dt>
      <dd className="text-body font-semibold">{value}</dd>
    </div>
  );
}
