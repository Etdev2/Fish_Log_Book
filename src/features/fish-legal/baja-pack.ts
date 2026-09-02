/**
 * Baja California (MX) pack — `baja-california-2026-09-01`.
 * Federal NOM-017 sporting rules, BC shoreline envelope (Tijuana–Punta Eugenia).
 */
import type { RegArea, RegPack } from "./types";
import { mexicoFederalRules } from "./mexico-shared";

export const BAJA_PACK: RegPack = {
  id: "baja-california-2026-09-01",
  version: 1,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "Baja California (CONAPESCA / NOM-017-PESC-1994): federal sport catch ceilings apply " +
    "nationwide — identical clauses as Baja California Sur. Envelope covers the Pacific " +
    "coast (Tijuana–Punta Eugenia) and the Upper Gulf side to 28° N.",
};

const VERIFIED = "2026-09-02";

export const BC_AREAS: readonly RegArea[] = [
  {
    id: "mx-baja-california",
    authority: "conapesca",
    kind: "ocean_region",
    name: "Baja California — coastal waters envelope",
    polygon: [[-117.1, 32.3], [-111.9, 32.3], [-111.9, 28.0], [-117.1, 28.0]],
    sourceUrl: "https://www.gob.mx/conapesca",
    verifiedAt: VERIFIED,
    notes: "Envelope spans peninsula (Ensenada & San Felipe inside; California out).",
  },
];

export const BAJA_CALIFORNIA = {
  pack: BAJA_PACK,
  areas: BC_AREAS,
  groups: [],
  rules: mexicoFederalRules("mx-baja-california"),
};
