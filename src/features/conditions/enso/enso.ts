/**
 * ENSO state by calendar month, for shading the tide chart's years-out range (ADR 012).
 *
 * History is CPC ONI v5 with CPC's episode rule: at least five consecutive overlapping
 * seasons at ≥ +0.5 °C (El Niño) or ≤ −0.5 °C (La Niña). Each season is attributed to its
 * centre month. The CPC outlook covers the nine seasons after the last observation; a month
 * there takes the phase with ≥ 50% probability, otherwise neutral. Past the outlook there is
 * no forecast, and the month says so rather than guessing.
 */
import { ONI_HISTORY, ONI_LAST, OUTLOOK } from "./enso-data.generated";

export type EnsoPhase = "el-nino" | "la-nina" | "neutral";
export type EnsoBasis = "observed" | "outlook" | "none";

export interface EnsoMonth {
  readonly year: number;
  /** 1–12 */
  readonly month: number;
  readonly phase: EnsoPhase | null;
  readonly basis: EnsoBasis;
  /** ONI anomaly (°C) for observed months. */
  readonly oni: number | null;
  /** Probability (%) of the shown phase, for outlook months. */
  readonly probability: number | null;
}

export const EPISODE_MIN_SEASONS = 5;
export const THRESHOLD = 0.5;

const key = (year: number, month: number) => year * 12 + (month - 1);

interface Entry {
  readonly year: number;
  readonly month: number;
  readonly sign: -1 | 0 | 1;
  readonly basis: "observed" | "outlook";
  readonly oni: number | null;
  readonly probability: number | null;
}

/** Observed seasons then outlook seasons, one sequence, so an episode running into the
 * outlook is still recognised by the five-season rule. */
export function ensoSequence(
  history: typeof ONI_HISTORY = ONI_HISTORY,
  last: { year: number; month: number } = ONI_LAST,
  outlook: typeof OUTLOOK = OUTLOOK,
): Entry[] {
  const seq: Entry[] = history.map(([year, month, oni]) => ({
    year,
    month,
    oni,
    probability: null,
    basis: "observed",
    sign: oni >= THRESHOLD ? 1 : oni <= -THRESHOLD ? -1 : 0,
  }));
  let k = key(last.year, last.month);
  for (const [, laNina, , elNino] of outlook) {
    k += 1;
    const sign = elNino >= 50 ? 1 : laNina >= 50 ? -1 : 0;
    seq.push({
      year: Math.floor(k / 12),
      month: (k % 12) + 1,
      oni: null,
      basis: "outlook",
      sign,
      probability: sign === 1 ? elNino : sign === -1 ? laNina : 100 - elNino - laNina,
    });
  }
  return seq;
}

export function classify(seq: readonly Entry[] = ensoSequence()): Map<number, EnsoMonth> {
  const out = new Map<number, EnsoMonth>();
  let i = 0;
  while (i < seq.length) {
    let j = i;
    while (j + 1 < seq.length && seq[j + 1].sign === seq[i].sign) j++;
    const runLength = j - i + 1;
    for (let n = i; n <= j; n++) {
      const e = seq[n];
      const phase: EnsoPhase =
        e.sign !== 0 && (runLength >= EPISODE_MIN_SEASONS || e.basis === "outlook")
          ? e.sign === 1
            ? "el-nino"
            : "la-nina"
          : "neutral";
      out.set(key(e.year, e.month), {
        year: e.year,
        month: e.month,
        phase,
        basis: e.basis,
        oni: e.oni,
        probability: e.probability,
      });
    }
    i = j + 1;
  }
  return out;
}

let cached: Map<number, EnsoMonth> | null = null;

/** Every calendar month touched by `[fromMs, toMs]`, in order, with its ENSO state (UTC). */
export function ensoMonths(fromMs: number, toMs: number): EnsoMonth[] {
  cached ??= classify();
  const start = new Date(fromMs);
  const end = new Date(toMs);
  const months: EnsoMonth[] = [];
  for (let k = key(start.getUTCFullYear(), start.getUTCMonth() + 1); k <= key(end.getUTCFullYear(), end.getUTCMonth() + 1); k++) {
    const year = Math.floor(k / 12);
    const month = (k % 12) + 1;
    months.push(cached.get(k) ?? { year, month, phase: null, basis: "none", oni: null, probability: null });
  }
  return months;
}
