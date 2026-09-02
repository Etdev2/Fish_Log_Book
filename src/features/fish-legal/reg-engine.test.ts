import { describe, expect, it } from "vitest";

import { SOCAL } from "./reg-data";
import { platformFor, regulationCard } from "./reg-engine";

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
