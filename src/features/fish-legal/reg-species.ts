/**
 * Species display names for the regulations surface. The catch vocabulary
 * (`core/ontology/species`) is the mirror it reads first; the rockfish wizard profiles
 * name the rest. Stable ids come from those two forms — this file adds nothing new, only
 * the join.
 */
import { SPECIES } from "@/core/ontology/species";
import { ROCKFISH_PROFILES } from "./rockfish-id";

const BY_ID = new Map<string, string>([
  ...SPECIES.map((s) => [s.id, s.commonName] as const),
  ...ROCKFISH_PROFILES.map((p) => [p.speciesId, p.commonName] as const),
]);

const ID_FALLBACKS: Record<string, string> = {
  sunset_rockfish: "Sunset rockfish",
  bronzespotted_rockfish: "Bronzespotted rockfish",
  quillback_rockfish: "Quillback rockfish",
};

export function speciesDisplayName(id: string): string {
  return (
    BY_ID.get(id) ??
    ID_FALLBACKS[id] ??
    id
      .split("_")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ")
  );
}
