/**
 * The precision ladder: the one place a coordinate is allowed to become coarser.
 *
 * `ontology.md` §6 already rules that `geo_cell_10km` is "the finest granularity any
 * cross-user aggregate may ever group by", and ships `geo_cell_1km` and `geo_cell_10km`
 * as generated columns. What it does not ship is a vocabulary — so every future screen,
 * job and export would have decided for itself what "coarse enough" meant, and one of
 * them would have decided wrong. This module is that vocabulary, and
 * `docs/specs/expansion/privacy-consent-and-data-governance.md` §6.1 is its spec.
 *
 * Pure, per ADR 003: no clock, no I/O, no id minting. The Swift client reproduces this
 * arithmetic from the same vectors rather than inventing a second ladder.
 *
 * **The cell formulas below must stay byte-identical to the generated columns in
 * `20260828120000_v1_core_schema.sql` and `20260915130000_geo_cell_50km.sql`.** A client
 * that computes a different cell than the database is a client that quietly excludes its
 * own rows from every aggregate.
 */

/**
 * Finest to coarsest. The order is the API: `coarsest()` and every comparison in
 * `effective.ts` depend on this array's index, so nothing may be inserted in the middle
 * without reading both.
 */
export const PRECISION_LEVELS = [
  "EXACT",
  "CELL_1KM",
  "CELL_10KM",
  "CELL_50KM",
  "ZONE",
  "NONE",
] as const;

export type PrecisionLevel = (typeof PRECISION_LEVELS)[number];

/** Rank on the ladder. Higher is coarser, i.e. safer. */
export function precisionRank(level: PrecisionLevel): number {
  return PRECISION_LEVELS.indexOf(level);
}

/**
 * The coarser of two levels, which is always the answer when two rules disagree.
 *
 * There is deliberately no `finest()`. Nothing in this system ever needs to widen a
 * disclosure, and a function that could would eventually be called by mistake.
 */
export function coarsestOf(a: PrecisionLevel, b: PrecisionLevel): PrecisionLevel {
  return precisionRank(a) >= precisionRank(b) ? a : b;
}

export interface Coordinate {
  readonly lat: number;
  readonly lng: number;
}

/** What a coarsened coordinate becomes. `null` geography is a legitimate result. */
export type CoarsenedLocation =
  | { readonly kind: "exact"; readonly lat: number; readonly lng: number }
  | { readonly kind: "cell"; readonly cell: string; readonly level: PrecisionLevel }
  | { readonly kind: "zone"; readonly zoneId: string | null }
  | { readonly kind: "none" };

/**
 * Degrees-per-cell divisor for each cell level, matching the SQL generated columns.
 *
 * These are LATITUDE degrees, so a cell is its nominal height and `cos(latitude)` times
 * that wide. A "10 km cell" is 11.1 km tall everywhere and about 9.3 km wide at 33°N,
 * 7.9 km at 45°N. That is fine for privacy — the cell only ever gets *narrower* than its
 * name as you go north, never wider — but a map legend that prints "10 km" is rounding,
 * and `fisheries-intelligence-map.md` §7.2 states the resolution rather than implying a
 * square.
 */
const CELL_DIVISOR: Readonly<Partial<Record<PrecisionLevel, number>>> = {
  CELL_1KM: 100, // 0.01° ≈ 1.11 km
  CELL_10KM: 10, //  0.1° ≈ 11.1 km
  CELL_50KM: 2, //   0.5° ≈ 55.6 km
};

/**
 * `floor(value * divisor)` as an integer, matching Postgres `(floor(x))::int`.
 *
 * `Math.floor` and SQL `floor` agree on negatives (both go toward minus infinity), which
 * is the half of this that is easy to get wrong: a naive truncation would put the
 * southern and northern halves of the equator in the same cell.
 */
function cellIndex(value: number, divisor: number): number {
  return Math.floor(value * divisor);
}

export function geoCell(coordinate: Coordinate, level: PrecisionLevel): string | null {
  const divisor = CELL_DIVISOR[level];
  if (divisor === undefined) return null;
  return `${cellIndex(coordinate.lat, divisor)}_${cellIndex(coordinate.lng, divisor)}`;
}

/**
 * Cells are a flat lat/lng grid, and a flat grid has two places it is simply wrong.
 *
 * Crossing the antimeridian, two points a kilometre apart land in cells 360° apart; at
 * the poles, a cell is a wedge of nearly zero width and every longitude collapses. Both
 * are refused rather than coarsened, because a wrong cell is worse than no cell: it puts
 * a catch in an aggregate it does not belong to, and no downstream consumer can detect
 * that. `data-architecture-expansion.md` §12 records H3/S2 as the Phase-5 replacement,
 * with this as the trigger for needing it.
 */
export function isCellSafe(coordinate: Coordinate): boolean {
  return (
    Number.isFinite(coordinate.lat) &&
    Number.isFinite(coordinate.lng) &&
    Math.abs(coordinate.lat) <= 85 &&
    Math.abs(coordinate.lng) <= 179.5
  );
}

/**
 * Coarsen a coordinate to a level. The only function permitted to do so.
 *
 * `zoneId` is supplied by the caller because a marine or regulatory zone is a lookup
 * against boundary data, and this module does no I/O. A ZONE disclosure with no zone
 * known is `{ kind: "zone", zoneId: null }` — honest, and still not a coordinate.
 */
export function coarsen(
  coordinate: Coordinate | null,
  level: PrecisionLevel,
  zoneId: string | null = null,
): CoarsenedLocation {
  if (level === "NONE") return { kind: "none" };
  if (level === "ZONE") return { kind: "zone", zoneId };
  if (coordinate === null) return { kind: "none" };

  if (level === "EXACT") {
    return { kind: "exact", lat: coordinate.lat, lng: coordinate.lng };
  }

  // A cell we cannot compute correctly is not downgraded to a coordinate. It fails
  // closed, to the coarsest thing that is still true.
  if (!isCellSafe(coordinate)) return { kind: "zone", zoneId };

  const cell = geoCell(coordinate, level);
  return cell === null ? { kind: "none" } : { kind: "cell", cell, level };
}
