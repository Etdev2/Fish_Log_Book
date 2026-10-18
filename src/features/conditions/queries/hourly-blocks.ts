/**
 * Hourly predictions are fetched and cached in fixed blocks of whole UTC days, only for the
 * part of the range the angler is looking at (ADR 011). Four years of hourly points is
 * ~70,000 samples; a block is ~670, which is what an iPhone can fetch, store and draw
 * without noticing. Blocks are aligned to the Unix epoch so the same instant always lands
 * in the same block, whatever the angler scrolled to first.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days per block. Well inside NOAA's one-year limit for hourly predictions. */
export const BLOCK_DAYS = 28;

export interface BlockBounds {
  /** First instant of the block (00:00 UTC). */
  readonly fromMs: number;
  /** Last UTC day of the block, as 00:00 UTC — the form NOAA's inclusive `end_date` takes. */
  readonly lastDayMs: number;
  /** First instant of the *next* block. Every sample in this block is strictly before it. */
  readonly endMs: number;
}

export function blockIndexAt(atMs: number): number {
  return Math.floor(Math.floor(atMs / DAY_MS) / BLOCK_DAYS);
}

export function blockBounds(index: number): BlockBounds {
  const fromMs = index * BLOCK_DAYS * DAY_MS;
  return { fromMs, lastDayMs: fromMs + (BLOCK_DAYS - 1) * DAY_MS, endMs: fromMs + BLOCK_DAYS * DAY_MS };
}

/** Indexes of every block overlapping `[fromMs, toMs]`, ascending. */
export function blocksCovering(fromMs: number, toMs: number): number[] {
  const out: number[] = [];
  for (let i = blockIndexAt(fromMs); i <= blockIndexAt(toMs); i++) out.push(i);
  return out;
}

export interface Span {
  readonly fromMs: number;
  readonly toMs: number;
}

/** Contiguous runs of blocks as `[from, to)` spans — what "hourly detail cached" means. */
export function blockRuns(indexes: readonly number[]): Span[] {
  const sorted = [...new Set(indexes)].sort((a, b) => a - b);
  const runs: Span[] = [];
  for (const index of sorted) {
    const { fromMs, endMs } = blockBounds(index);
    const last = runs[runs.length - 1];
    if (last && last.toMs === fromMs) runs[runs.length - 1] = { fromMs: last.fromMs, toMs: endMs };
    else runs.push({ fromMs, toMs: endMs });
  }
  return runs;
}
