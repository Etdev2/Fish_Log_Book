/**
 * Baja California Sur (MX) pack — `baja-california-sur-2026-09-01`.
 * Federal NOM-017 sporting rules, BCS shoreline envelope (28° N – Cabo San Lucas).
 * The legacy `cabo_baja` Settings region resolves here too (Cabo is in BCS).
 */
import type { RegArea, RegPack } from "./types";
import { mexicoFederalRules } from "./mexico-shared";

export const BCS_PACK: RegPack = {
  id: "baja-california-sur-2026-09-01",
  version: 1,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "Baja California Sur (CONAPESCA / NOM-017-PESC-1994): federal sport catch ceilings; " +
    "same clauses as Baja California (no state-level catch-limit divergence found — " +
    "state differences are in licensing/boat permits, not bags). Envelope covers La Paz " +
    "to Cabo San Lucas.",
};

const VERIFIED = "2026-09-02";

export const BCS_AREAS: readonly RegArea[] = [
  {
    id: "mx-baja-california-sur",
    authority: "conapesca",
    kind: "ocean_region",
    name: "Baja California Sur — coastal waters envelope",
    polygon: [[-112.6, 28.0], [-109.2, 28.0], [-109.2, 22.4], [-112.6, 22.4]],
    sourceUrl: "https://www.gob.mx/conapesca",
    verifiedAt: VERIFIED,
    notes: "Envelope spans peninsula (Cabo San Lucas & La Paz inside).",
  },
];

export const BAJA_CALIFORNIA_SUR = {
  pack: BCS_PACK,
  areas: BCS_AREAS,
  groups: [],
  rules: mexicoFederalRules("mx-baja-california-sur"),
};
