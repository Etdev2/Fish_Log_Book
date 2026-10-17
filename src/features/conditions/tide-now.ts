/**
 * The words and the staff level for the home screen's tide card. Pure: the reading, the
 * clock and the formatters are all passed in, so the phrasing is testable without React.
 */
import type { TideReading, TideTurn } from "@/core/rules/tide";

import { unwrapSourced } from "./components/sourced-value";

export interface TideNowCopy {
  /** "Falling toward low tide at 3:42 PM". */
  readonly headline: string;
  /** "Low of 1.2 ft in 2h 10m.", or null when no turn is ahead in the data. */
  readonly upcoming: string | null;
  /** 0 (at the low) to 1 (at the high) between the bounding turns, or null if unknown. */
  readonly staffLevel: number | null;
}

export interface TideNowFormat {
  readonly clock: (atMs: number) => string;
  readonly height: (metres: number) => string;
  readonly duration: (deltaMs: number) => string;
}

const KIND_WORD: Record<TideTurn["kind"], string> = { high: "high", low: "low" };

const OTHER_KIND: Record<TideTurn["kind"], TideTurn["kind"]> = { high: "low", low: "high" };

/**
 * The kind of turn sitting exactly at the reading time, if any. The turn lookups exclude a
 * turn at that instant, and highs and lows alternate, so two neighbours of the same kind
 * mean the turn between them is now (Codex review, PR #165).
 */
function kindAtReading(reading: TideReading): TideTurn["kind"] | null {
  const { previousTurn: prev, nextTurn: next } = reading;
  return prev !== null && next !== null && prev.kind === next.kind ? OTHER_KIND[prev.kind] : null;
}

/** The turn the slack belongs to: whichever bounding turn is closer to now. */
function nearerKind(reading: TideReading, nowMs: number): TideTurn["kind"] | null {
  const exact = kindAtReading(reading);
  if (exact !== null) return exact;
  return nearerTurn(reading, nowMs)?.kind ?? null;
}

function nearerTurn(reading: TideReading, nowMs: number): TideTurn | null {
  const { previousTurn: prev, nextTurn: next } = reading;
  if (prev === null) return next;
  if (next === null) return prev;
  return nowMs - Number(prev.at) <= Number(next.at) - nowMs ? prev : next;
}

export function tideNowCopy(reading: TideReading, nowMs: number, format: TideNowFormat): TideNowCopy {
  const next = reading.nextTurn;
  const upcoming =
    next === null
      ? null
      : `${capitalise(KIND_WORD[next.kind])} of ${format.height(Number(next.height))} in ${format.duration(Number(next.at) - nowMs)}.`;

  let headline: string;
  if (reading.motion === "rising" || reading.motion === "falling") {
    const verb = reading.motion === "rising" ? "Rising" : "Falling";
    headline =
      next === null ? verb : `${verb} toward ${KIND_WORD[next.kind]} tide at ${format.clock(Number(next.at))}`;
  } else {
    const kind = nearerKind(reading, nowMs);
    const slack = reading.motion === "slack" ? "Slack" : "Nearly slack";
    headline = kind === null ? `${slack} water` : `${slack} at ${KIND_WORD[kind]} tide`;
  }

  return { headline, upcoming, staffLevel: staffLevel(reading) };
}

function staffLevel(reading: TideReading): number | null {
  const exact = kindAtReading(reading);
  if (exact !== null) return exact === "high" ? 1 : 0;
  const { previousTurn: prev, nextTurn: next } = reading;
  if (prev === null || next === null) return null;
  const low = Math.min(Number(prev.height), Number(next.height));
  const high = Math.max(Number(prev.height), Number(next.height));
  if (high - low <= 0) return null;
  // Geometry, not a fact on screen: the staff is a picture of the sentence beside it.
  const level = (Number(unwrapSourced(reading.height)) - low) / (high - low);
  return Math.max(0, Math.min(1, level));
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
