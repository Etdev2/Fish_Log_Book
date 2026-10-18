import { describe, expect, it } from "vitest";

import { SPECIES } from "@/core/ontology/species";

import { ALASKA } from "./alaska-pack";
import { NORCAL } from "./norcal-pack";
import { OREGON } from "./oregon-pack";
import { SOCAL } from "./reg-data";
import { regulationCard } from "./reg-engine";
import { WASHINGTON } from "./washington-pack";

// CCR T14 §28.55: quillback may not be taken or possessed anywhere in California.
// CDFW Groundfish Summary (updated 2026-06-23), retrieved 2026-10-18.
const QUILLBACK = "quillback_rockfish";
const CA_PACK = {
  ...SOCAL,
  areas: [...SOCAL.areas, ...NORCAL.areas],
  groups: [...SOCAL.groups, ...NORCAL.groups],
  rules: [...SOCAL.rules, ...NORCAL.rules],
};
const CA_AREAS = [
  "ca-ocean-northern",
  "ca-gma-northern",
  "ca-gma-mendocino",
  "ca-gma-san-francisco",
  "ca-gma-central",
  "ca-ocean-southern",
  "ca-gma-southern",
];

describe("quillback rockfish in California", () => {
  it("is a protected species in the vocabulary", () => {
    expect(SPECIES.find((s) => s.id === QUILLBACK)?.takeStatus).toBe("protected");
  });

  for (const area of CA_AREAS) {
    for (const date of ["2026-02-01", "2026-06-15", "2026-10-18"]) {
      it(`is release in ${area} on ${date}`, () => {
        const card = regulationCard(CA_PACK, area, QUILLBACK, date, "boat");
        expect(card?.verdict).toBe("release");
        expect(card?.verdictReason).toContain("Zero retention");
      });
    }
  }
});

describe("quillback rockfish outside California is unchanged", () => {
  it("Oregon keeps its species-level prohibition", () => {
    const row = OREGON.rules.find((r) => r.id === "or-quillback-prohibited");
    expect(row?.kind).toBe("prohibited");
  });

  it("Washington keeps its May–July closure", () => {
    const row = WASHINGTON.rules.find((r) => r.id === "wa-quillback-closed-mjj");
    expect(row).toMatchObject({ kind: "season", seasonStart: "05-01", seasonEnd: "07-31" });
  });

  it("Alaska still counts quillback in demersal shelf rockfish", () => {
    const dsr = ALASKA.groups.find((g) => g.id === "akse-dsr");
    expect(dsr?.memberSpeciesIds).toContain(QUILLBACK);
  });
});
