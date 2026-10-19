/**
 * Every rockfish the app knows about, in one list (founder, 2026-10-18: "a complete
 * catalog with images of the rockfish").
 *
 * Built from what the app already holds rather than a fourth hand-kept list: the rockfish
 * ID profiles, the species vocabulary's rockfish, and the rockfish we have a checked
 * picture of. `rockfish-catalog.test.ts` fails if any of those three gains a rockfish this
 * list misses. The catalog is honest about its edge: California has many more Sebastes
 * species than this, and the page says so.
 */

import { SPECIES } from "@/core/ontology/species";
import { SOCAL } from "./reg-data";
import { ROCKFISH_PROFILES } from "./rockfish-id";

/**
 * Species the SoCal pack names in a year-round, species-level `prohibited` rule (CCR T14
 * §28.55, "No Retention at Any Time"). The rules are the sourced authority, so the catalog
 * reads them rather than trusting the vocabulary's `takeStatus`, which lagged them for
 * quillback (#171).
 */
const NO_TAKE_BY_RULE: ReadonlySet<string> = new Set(
  SOCAL.rules.flatMap((r) =>
    r.kind === "prohibited" && r.speciesId !== null && r.seasonStart === null ? [r.speciesId] : [],
  ),
);

export interface CatalogRockfish {
  readonly speciesId: string;
  readonly commonName: string;
  readonly scientificName: string;
  /** No-take in the profile, protected in the vocabulary, or prohibited by the rules. */
  readonly noRetention: boolean;
}

/**
 * Rockfish we hold a picture of but that neither the ID nor the vocabulary lists yet.
 * Scientific names are the accepted Sebastes binomials.
 */
const PICTURE_ONLY: readonly CatalogRockfish[] = [
  { speciesId: "bronzespotted_rockfish", commonName: "Bronzespotted rockfish", scientificName: "Sebastes gilli", noRetention: true },
  { speciesId: "brown_rockfish", commonName: "Brown rockfish", scientificName: "Sebastes auriculatus", noRetention: false },
  { speciesId: "calico_rockfish", commonName: "Calico rockfish", scientificName: "Sebastes dallii", noRetention: false },
  { speciesId: "china_rockfish", commonName: "China rockfish", scientificName: "Sebastes nebulosus", noRetention: false },
  { speciesId: "grass_rockfish", commonName: "Grass rockfish", scientificName: "Sebastes rastrelliger", noRetention: false },
  { speciesId: "treefish", commonName: "Treefish", scientificName: "Sebastes serriceps", noRetention: false },
];

function build(): readonly CatalogRockfish[] {
  const byId = new Map<string, CatalogRockfish>();
  for (const p of ROCKFISH_PROFILES) {
    byId.set(p.speciesId, {
      speciesId: p.speciesId,
      commonName: p.commonName,
      scientificName: p.scientificName,
      noRetention: p.noRetention,
    });
  }
  for (const s of SPECIES) {
    if (s.rollsUpTo !== "rockfish" || s.scientificName === null) continue;
    const known = byId.get(s.id);
    byId.set(s.id, {
      speciesId: s.id,
      commonName: known?.commonName ?? s.commonName,
      scientificName: known?.scientificName ?? s.scientificName,
      noRetention: (known?.noRetention ?? false) || s.takeStatus === "protected",
    });
  }
  for (const r of PICTURE_ONLY) if (!byId.has(r.speciesId)) byId.set(r.speciesId, r);
  return [...byId.values()]
    .map((r) => (NO_TAKE_BY_RULE.has(r.speciesId) ? { ...r, noRetention: true } : r))
    .sort((a, b) => a.commonName.localeCompare(b.commonName));
}

export const ROCKFISH_CATALOG: readonly CatalogRockfish[] = build();
