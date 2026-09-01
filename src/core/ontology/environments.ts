/**
 * Fishing environments (ADR 007 §5, founder requirements 2026-09-01 §5).
 *
 * The long-term shape: one fishing platform, not a saltwater product with freshwater
 * bolted on. This module is the type groundwork for that — the vocabulary of *where a
 * catch happens*, unused by any screen yet, landed now so nothing coming next (spots,
 * map, conditions) hard-codes ocean assumptions that a lake angler would pay for later.
 *
 * What matters and what doesn't, per environment, drives the future conditions UI:
 * a reservoir angler cares about water level and clarity; an offshore angler cares
 * about swell and current. Nobody is offered the other one's questions. That mapping
 * is product work for later slices — what ships here is the enum, the water-class
 * roll-up, and the rule that the data model never assumes one.
 */

import type { WaterClass } from "./species";

export type FishingEnvironment =
  | "ocean"
  | "inshore"
  | "bay"
  | "harbor"
  | "lake"
  | "reservoir"
  | "river"
  | "stream";

export interface FishingEnvironmentSpec {
  readonly id: FishingEnvironment;
  readonly label: string;
  readonly waterClass: WaterClass;
  /**
   * Honest placeholder for the per-environment conditions set. Empty is the truth
   * today; the day conditions become environment-aware this says which ones.
   */
  readonly conditionEmphasis: readonly string[];
}

export const FISHING_ENVIRONMENTS: readonly FishingEnvironmentSpec[] = [
  { id: "ocean", label: "Ocean / offshore", waterClass: "salt", conditionEmphasis: ["swell", "current", "wind", "tide"] },
  { id: "inshore", label: "Inshore", waterClass: "salt", conditionEmphasis: ["tide", "wind", "water_clarity"] },
  { id: "bay", label: "Bay / estuary", waterClass: "salt", conditionEmphasis: ["tide", "water_clarity", "current"] },
  { id: "harbor", label: "Harbor", waterClass: "salt", conditionEmphasis: ["tide", "water_clarity"] },
  { id: "lake", label: "Lake", waterClass: "fresh", conditionEmphasis: ["water_temperature", "water_clarity", "wind"] },
  { id: "reservoir", label: "Reservoir", waterClass: "fresh", conditionEmphasis: ["water_level", "water_temperature", "water_clarity"] },
  { id: "river", label: "River", waterClass: "fresh", conditionEmphasis: ["flow", "water_temperature", "water_clarity"] },
  { id: "stream", label: "Stream", waterClass: "fresh", conditionEmphasis: ["flow", "water_temperature"] },
];

const ENV_BY_ID = new Map(FISHING_ENVIRONMENTS.map((e) => [e.id, e]));

export function environmentById(id: string): FishingEnvironmentSpec | null {
  return ENV_BY_ID.get(id as FishingEnvironment) ?? null;
}
