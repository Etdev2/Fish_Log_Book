import { describe, expect, it } from "vitest";

import { MASSACHUSETTS } from "./massachusetts-pack";
import { PACKS } from "./packs";
import { SOCAL } from "./reg-data";
import { inSeasonWindow, platformFor, regulationCard } from "./reg-engine";

const TODAY = "2026-09-01"; // pack verification day — Southern region page's own stamp

describe("regulation engine (founder §4/§15 verdict ladder)", () => {
  it("answers an in-limit staple as keep with its numbers", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "california_halibut", TODAY, "boat");
    expect(card).not.toBeNull();
    expect(card!.verdict).toBe("keep");
    expect(card!.bagDaily).toBe(5);
    expect(card!.minSizeIn).toBe(22);
    expect(card!.sizeMeasure).toBe("total_length");
  });

  it("prohibited species are release, with the law's own words as the reason", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "giant_sea_bass", TODAY, "boat");
    expect(card!.verdict).toBe("release");
    expect(card!.verdictReason).toContain("Zero retention");
  });

  it("coho is release inside the salmon window (prohibited, season-scoped)", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "coho_salmon", TODAY, "boat");
    expect(card!.verdict).toBe("release");
  });

  it("chinook is conditional inside the window: the harvest guideline can close early", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "chinook_salmon", TODAY, "boat");
    expect(card!.verdict).toBe("conditional");
    expect(card!.bagDaily).toBe(2);
    expect(card!.verdictReason).toContain("in-season");
  });

  it("chinook is release the morning after the window closes (spec QA: season changing at midnight)", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "chinook_salmon", "2026-10-01", "boat");
    expect(card!.verdict).toBe("release");
    expect(card!.verdictReason).toContain("closed");
  });

  it("sheephead by boat is keep in September and release in January", () => {
    expect(
      regulationCard(SOCAL, "ca-ocean-southern", "california_sheephead", TODAY, "boat")!.verdict,
    ).toBe("keep");
    expect(
      regulationCard(SOCAL, "ca-ocean-southern", "california_sheephead", "2026-01-15", "boat")!.verdict,
    ).toBe("release");
  });

  it("sheephead from shore is keep all year — the year-round platform rows stand", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "california_sheephead", "2026-01-15", "shore");
    expect(card!.verdict).toBe("keep");
  });

  it("vermilion rockfish by boat in September is conditional on the 50-fm line, bag 2", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "vermilion_rockfish", TODAY, "boat");
    expect(card!.verdict).toBe("conditional");
    expect(card!.bagDaily).toBe(2);
    expect(card!.verdictReason).toContain("50 fathom");
    expect(card!.groupNote).toContain("10 fish in combination");
  });

  it("the same vermilion from SHORE is keep — the exempt footnote is data, not decoration", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "vermilion_rockfish", TODAY, "shore");
    expect(card!.verdict).toBe("keep");
    expect(card!.specialRules.some((s) => s.includes("exempt"))).toBe(true);
  });

  it("groundfish seasons reopen but stay conditional in May (all-depth window, in-season flag)", () => {
    const card = regulationCard(SOCAL, "ca-gma-southern", "blue_rockfish", "2026-05-15", "boat");
    expect(card!.verdict).toBe("conditional"); // checkInseason: groundfish moves in-season
    expect(card!.verdictReason).not.toContain("50 fathom");
  });

  it("groundfish boat in February is release — closed window", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "blue_rockfish", "2026-02-01", "boat");
    expect(card!.verdict).toBe("release");
    expect(card!.verdictReason).toContain("closed");
  });

  it("lingcod in October is offshore-only — the split season is not the nearshore one", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "lingcod", "2026-10-15", "boat");
    expect(card!.verdict).toBe("conditional");
    expect(card!.verdictReason).toContain("offshore only");
  });

  it("yelloweye is release regardless of the season window (prohibited outranks windows)", () => {
    expect(
      regulationCard(SOCAL, "ca-ocean-southern", "yelloweye_rockfish", TODAY, "boat")!.verdict,
    ).toBe("release");
    expect(
      regulationCard(SOCAL, "ca-ocean-southern", "yelloweye_rockfish", TODAY, "shore")!.verdict,
    ).toBe("release");
  });

  it("a species the pack does not cover returns null — the screen says No verified data", () => {
    expect(regulationCard(SOCAL, "ca-ocean-southern", "pacific_mackerel", TODAY, "boat")).toBeNull();
  });

  it("barred sand bass names its own tighter cap inside the shared bag", () => {
    const card = regulationCard(SOCAL, "ca-ocean-southern", "barred_sand_bass", TODAY, "boat");
    expect(card!.verdict).toBe("keep");
    expect(card!.bagDaily).toBe(4);
    expect(card!.groupNote).toContain("five fish in any combination");
  });

  it("cards born yesterday are fresh; the same card in December is stale (§23)", () => {
    expect(regulationCard(SOCAL, "ca-ocean-southern", "california_halibut", TODAY, "boat")!.isStale).toBe(false);
    const stale = regulationCard(SOCAL, "ca-ocean-southern", "california_halibut", "2026-12-15", "boat")!;
    expect(stale.isStale).toBe(true);
    expect(stale.staleDays).toBeGreaterThan(100);
  });

  it("platform mapping: kayak is a vessel, spearfishing is the diver carve-out", () => {
    expect(platformFor("kayak")).toBe("boat");
    expect(platformFor("spearfishing")).toBe("diver");
  });
});

describe("inSeasonWindow year-wrap + mixed MM-DD/YYYY-MM-DD forms", () => {
  const wrapRule = { seasonStart: "12-01", seasonEnd: "09-15" } as Parameters<typeof inSeasonWindow>[0];
  it("a wrapped window (Dec 1 → Sep 15) matches both sides of New Year's", () => {
    expect(inSeasonWindow(wrapRule, "2026-12-01")).toBe(true);  // opening day
    expect(inSeasonWindow(wrapRule, "2027-01-15")).toBe(true);  // mid-winter
    expect(inSeasonWindow(wrapRule, "2027-09-15")).toBe(true);  // closing day
    expect(inSeasonWindow(wrapRule, "2026-10-01")).toBe(false); // the old bug: Oct read as in-season
    expect(inSeasonWindow(wrapRule, "2026-11-30")).toBe(false); // eve of open
  });
  it("MM-DD rule bounds compare correctly against YYYY-MM-DD dateKeys", () => {
    const md = { seasonStart: "05-01", seasonEnd: "06-15" } as Parameters<typeof inSeasonWindow>[0];
    expect(inSeasonWindow(md, "2026-05-01")).toBe(true);
    expect(inSeasonWindow(md, "2027-06-20")).toBe(false); // year must not leak
  });
  it("full-date bounds still compare as full dates", () => {
    const fd = { seasonStart: "2026-09-01", seasonEnd: "2026-09-30" } as Parameters<typeof inSeasonWindow>[0];
    expect(inSeasonWindow(fd, "2026-09-15")).toBe(true);
    expect(inSeasonWindow(fd, "2026-10-01")).toBe(false);
    expect(inSeasonWindow(fd, "2027-09-15")).toBe(true); // recurring by month-day
  });
});

describe("a species with no rule for the angler's platform", () => {
  // Regression: buildCard used to read on with an empty rule pool and crash on
  // `firstSource.sourceUrl`. MA scup carries a shore row and a boat row and nothing
  // else, so a spear diver matched neither. 23 species/area/platform combos across
  // six packs threw a TypeError on what is a user-facing regulations card.
  it("returns null rather than throwing when every row is scoped to another platform", () => {
    expect(() =>
      regulationCard(MASSACHUSETTS, "ma-statewide", "scup", "2026-09-03", "diver"),
    ).not.toThrow();
    expect(regulationCard(MASSACHUSETTS, "ma-statewide", "scup", "2026-09-03", "diver")).toBeNull();
  });

  it("still reads the platform-matching row for shore and boat", () => {
    expect(regulationCard(MASSACHUSETTS, "ma-statewide", "scup", "2026-09-03", "shore")!.minSizeIn)
      .toBe(9.5);
    expect(regulationCard(MASSACHUSETTS, "ma-statewide", "scup", "2026-09-03", "boat")!.minSizeIn)
      .toBe(11);
  });

  it("no bundled pack throws for any species/area/platform combination", () => {
    for (const entry of PACKS) {
      const pack = entry.data;
      const species = new Set(
        pack.rules.map((r) => r.speciesId).filter((id): id is string => id !== null),
      );
      for (const area of pack.areas) {
        for (const speciesId of species) {
          for (const platform of ["shore", "boat", "diver"] as const) {
            expect(
              () => regulationCard(pack, area.id, speciesId, "2026-09-03", platform),
              `${pack.pack.id} ${area.id} ${speciesId} ${platform}`,
            ).not.toThrow();
          }
        }
      }
    }
  });
});
