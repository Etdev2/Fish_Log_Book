/**
 * Boundary-aware alerts (spec §13, §14, Phase 3 foundation).
 *
 * PURE state machine per tracked zone: OUTSIDE → NEAR → INSIDE → NEAR → OUTSIDE.
 * Only mode CHANGES emit events — a logger chains positions through and gets alerts on
 * transitions, never vibration-on-every-ping (spec §14: no repeat notifications while
 * the state persists). "Near" is meters to polygon edge; inside is point-in-ring.
 *
 * What will render an alert is a UI/settings concern (legal-alerts prefs), kept out of
 * here so this module is test-verifiable end-to-end. Honest limits are declared on the
 * alert itself: accuracy, ring simplification, and the fact that prohibition reads are
 * texts in the pack, not enforcement-grade surveys.
 */
import { distanceToRingM, pointInRing } from "./geospatial";
import type { RegArea } from "./types";

export type ZoneState = "outside" | "near" | "inside";

export type BoundaryEventKind =
  | "entered" // outside|near -> inside
  | "approached" // outside -> near
  | "exited" // inside|near -> outside
  | "cat" // near -> outside (backed off; logged quietly, no banner copy drama)
;

export interface BoundaryEvent {
  readonly zoneId: string;
  readonly zoneName: string;
  readonly kind: BoundaryEventKind;
  readonly distanceM: number | null;
  readonly atIso: string;
  readonly accuracyM: number | null;
}

export interface ZoneWatch {
  readonly zoneId: string;
  readonly zoneName: string;
  readonly state: ZoneState;
  readonly lastDistanceM: number | null;
}

/** Meters at which OUTSIDE becomes NEAR. ~1/3 nm ≈ 600 m: a fishing drift's notice. */
export const NEAR_BAND_M = 600;

export function computeZoneState(
  ring: readonly (readonly [number, number])[],
  pos: readonly [number, number], // [lng, lat]
): { state: ZoneState; distanceM: number } {
  if (pointInRing(pos, ring)) return { state: "inside", distanceM: 0 };
  const d = distanceToRingM(pos, ring);
  return { state: d <= NEAR_BAND_M ? "near" : "outside", distanceM: d };
}

/** Fold one new fix into the per-zone watch state; emits at most one event. */
export function foldPosition(
  area: RegArea,
  previous: ZoneState,
  pos: readonly [number, number],
  atIso: string,
  accuracyM: number | null,
): { next: ZoneState; event: BoundaryEvent | null; distanceM: number | null } {
  if (!area.polygon || area.polygon.length < 3) {
    return { next: previous, event: null, distanceM: null };
  }
  const { state, distanceM } = computeZoneState(area.polygon, pos);
  if (state === previous) return { next: previous, event: null, distanceM };

  // Transition classes; near->outside and outside->near carry meaning only entered/exited
  // matter for no-take style zones — "approached" exists so the map can quietly tickle.
  let kind: BoundaryEventKind | null = null;
  if (state === "inside") kind = "entered";
  else if (state === "near" && previous !== "inside") kind = "approached";
  else if (state === "outside") kind = previous === "inside" ? "exited" : "cat";

  if (kind === null || kind === "cat") return { next: state, event: null, distanceM };
  return {
    next: state,
    distanceM,
    event: {
      zoneId: area.id,
      zoneName: area.name,
      kind,
      distanceM,
      atIso,
      accuracyM,
    },
  };
}

/** All zones of a bundle, folding one fix across each. Zones not yet mapped are silent. */
export function foldAcrossBundle(
  areas: readonly RegArea[],
  watches: ReadonlyMap<string, ZoneState>,
  pos: readonly [number, number],
  atIso: string,
  accuracyM: number | null,
): { watches: Map<string, ZoneState>; events: BoundaryEvent[] } {
  const next = new Map(watches);
  const events: BoundaryEvent[] = [];
  for (const area of areas) {
    const folded = foldPosition(area, next.get(area.id) ?? "outside", pos, atIso, accuracyM);
    next.set(area.id, folded.next);
    if (folded.event) events.push(folded.event);
  }
  return { watches: next, events };
}
