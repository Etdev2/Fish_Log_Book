/**
 * The always-visible notice on the tide chart when the numbers are not live NOAA (ADR 011).
 * Pure, so the three cases — saved on the device, bundled sample, live — are unit-tested
 * without rendering the chart.
 */

import type { TideSource } from "./queries/use-tide-series";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ProvenanceNotice {
  readonly kind: "cache" | "fixture";
  readonly text: string;
}

export interface ProvenanceInput {
  readonly source: TideSource;
  /** When the saved predictions were fetched, ms since epoch; null if unknown. */
  readonly retrievedAtMs: number | null;
  readonly nowMs: number | null;
  readonly timeZone: string;
}

function ageText(retrievedAtMs: number, nowMs: number): string {
  const days = Math.floor(Math.max(0, nowMs - retrievedAtMs) / DAY_MS);
  if (days >= 1) return `${days} ${days === 1 ? "day" : "days"} old`;
  const hours = Math.floor(Math.max(0, nowMs - retrievedAtMs) / (60 * 60 * 1000));
  return hours >= 1 ? `${hours} ${hours === 1 ? "hour" : "hours"} old` : "less than an hour old";
}

/** Null on a live load: no banner when the data is fresh from NOAA. */
export function provenanceNotice(input: ProvenanceInput): ProvenanceNotice | null {
  switch (input.source) {
    case "fixture":
      return { kind: "fixture", text: "Offline: showing sample data, not your station" };
    case "cache": {
      if (input.retrievedAtMs === null) {
        return { kind: "cache", text: "Offline: showing cached NOAA predictions, date unknown" };
      }
      const date = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: input.timeZone,
      }).format(input.retrievedAtMs);
      const age = input.nowMs === null ? "" : `, ${ageText(input.retrievedAtMs, input.nowMs)}`;
      return { kind: "cache", text: `Offline: showing cached NOAA predictions from ${date}${age}` };
    }
    default:
      return null;
  }
}
