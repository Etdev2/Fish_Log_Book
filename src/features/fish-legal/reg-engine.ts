/**
 * The regulation engine (founder spec §3, §4, §15): date + species (+ group) + platform
 * → ONE verdict card, verdict first. Pure: the day is a parameter (ADR 006 §7 — no
 * wall-clock reads in rules), the pack is a parameter.
 *
 * Reading order the UI mirrors: KEEP / RELEASE / CONDITIONAL → bag → size → season →
 * depth → special. `conditional` is the honest middle: something real (platform split,
 * in-season change, a boundary line) can flip the answer, and the card says what.
 *
 * The engine never returns "perfectly fine": a card is data with citations or nothing
 * at all (`null` → the screen renders "No verified data", spec §4/§23).
 */
import type {
  FishingMode,
  PlatformScope,
  RegGroup,
  RegRule,
  RegulationCard,
  SocalPack,
} from "./types";

/** Kayak is a vessel under CDFW groundfish law; spearfishing counts as the diver carve-out. */
export function platformFor(mode: FishingMode): PlatformScope {
  if (mode === "shore") return "shore";
  if (mode === "spearfishing") return "diver";
  return "boat";
}

/**
 * Inclusive [start, end]; null bound = unbounded (year-round).
 *
 * Both rule bounds and the dateKey may be full "YYYY-MM-DD" or "MM-DD" — the 24-state
 * species tables carry recurring "(book-year)" MM-DD seasons while the SQL packs pin
 * the federal-book year. Compares on MM-DD so either form reads correctly.
 *
 * Year-wrap: when start > end the season spans New Year's (WA crab pots Dec 1 →
 * Sep 15; Willapa Nov 15 → Sep 15). In-window then means date ≥ start OR date ≤ end.
 */
const mmdd = (s: string): string => (s.length >= 10 ? s.slice(5) : s);

export function inSeasonWindow(rule: RegRule, dateKey: string): boolean {
  const s = rule.seasonStart === null ? null : mmdd(rule.seasonStart);
  const e = rule.seasonEnd === null ? null : mmdd(rule.seasonEnd);
  const d = mmdd(dateKey);
  if (s !== null && e !== null && s > e) return d >= s || d <= e;
  if (s !== null && d < s) return false;
  if (e !== null && d > e) return false;
  return true;
}

function isClosedNote(note: string | null): boolean {
  return note !== null && note.toLowerCase().startsWith("closed");
}

/** All rows that speak to this species in this area: its own plus its groups'. */
export function rulesForSpecies(
  pack: SocalPack,
  areaId: string,
  speciesId: string,
): { rules: readonly RegRule[]; groups: readonly RegGroup[] } {
  const groups = pack.groups.filter((g) => g.memberSpeciesIds.includes(speciesId));
  const groupIds = new Set(groups.map((g) => g.id));
  const rules = pack.rules.filter(
    (r) =>
      r.regAreaId === areaId &&
      (r.speciesId === speciesId || (r.regGroupId !== null && groupIds.has(r.regGroupId))),
  );
  return { rules, groups };
}

function platformMatches(rule: RegRule, platform: PlatformScope): boolean {
  return rule.platformScope === null || rule.platformScope === platform;
}

function buildCard(
  speciesId: string,
  rules: readonly RegRule[],
  groups: readonly RegGroup[],
  dateKey: string,
  platform: PlatformScope,
): RegulationCard | null {
  if (rules.length === 0) return null;

  const usable = rules.filter((r) => platformMatches(r, platform));
  // Every row that speaks to this species is scoped to a platform this angler is not
  // on (MA scup is shore-or-boat only, so a spear diver matches neither; WA surfperch
  // is shore-only). There is no verified rule to read, and the module contract above
  // is explicit that a card is data with citations or nothing at all — so return null
  // and let the screen render "No verified data" (spec §4/§23) rather than quoting a
  // limit that does not apply. Reading on would also dereference an empty rule list.
  if (usable.length === 0) return null;

  // Shore-based anglers and spear divers are exempt from RCG-complex season and DEPTH
  // restrictions (CCR T14 §27.20(b)(1)(C)/(D), the rcg-exempt note row). For those
  // platforms the groundfish windows drop out of the VERDICT reading entirely — the
  // exemption note itself still lands in specialRules, so the card explains why.
  const groundfishExempt =
    platform !== "boat" && rules.some((r) => r.regGroupId === "rcg-complex");
  const verdictPool = usable.filter(
    (r) => !(groundfishExempt && r.regGroupId === "rcg-complex" && r.kind === "season"),
  );
  const active = verdictPool.filter((r) => inSeasonWindow(r, dateKey));

  const pick = <T>(map: (r: RegRule) => T | null): T | null => {
    for (const r of [...active].sort((a, b) => (b.bagDaily ?? 99) - (a.bagDaily ?? 99))) {
      const v = map(r);
      if (v !== null) return v;
    }
    return null;
  };

  // Tightest reading wins: a species-level bag cap (copper 1) beats the group 10.
  const bagRules = active.filter((r) => r.kind === "bag_limit" && r.bagDaily !== null);
  const speciesCap = bagRules.filter((r) => r.speciesId === speciesId);
  const bagRule =
    [...speciesCap].sort((a, b) => (a.bagDaily ?? 99) - (b.bagDaily ?? 99))[0] ??
    [...bagRules].sort((a, b) => (a.bagDaily ?? 99) - (b.bagDaily ?? 99))[0] ??
    null;
  // Size comes from dedicated size rows first, then any row that typed a size (slot
  // limits in Florida live on the bag row). kind-order preference, same as CDFW pack.
  const sizeRule =
    active.find((r) => r.kind === "min_size" && (r.minSizeIn !== null || r.maxSizeIn !== null)) ??
    active.find((r) => r.minSizeIn !== null || r.maxSizeIn !== null) ??
    null;
  // Group-level zero-retention ("these four rockfish may never be kept") is NOT a
  // prohibition on the complex — it is a warning that belongs on every member's card
  // (spec §6), while this member's own prohibition row is what can RELEASE it below.
  const groupProhibitionWarnings = active
    .filter((r) => r.kind === "prohibited" && r.regGroupId !== null && r.speciesId === null)
    .map((r) => r.verbatim);
  const specialRules = [
    ...groupProhibitionWarnings,
    ...active.filter((r) => r.kind === "note" || r.kind === "gear").map((r) => r.verbatim),
  ];
  const groupBag = groups.length > 0 ? (bagRules.find((r) => r.bagSharesWithGroup) ?? null) : null;

  // Lowest horizon among the rows on the card governs staleness (in-season rows age
  // faster; the card inherits that).
  const horizon = Math.min(...[...active, ...usable].map((r) => r.staleAfterDays));
  const verifiedAt = [...active, ...usable]
    .map((r) => r.verifiedAt)
    .sort()[0]; // oldest verification on the card is the honest one
  const daysSince = Math.floor((Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${verifiedAt}T00:00:00Z`)) / 86_400_000);

  // Verdict ladder (§15): prohibited > closed season > boundary/platform conditional >
  // in-season-change conditional > keep.
  //
  // Only THIS species' own prohibited row can release it — the complex-level
  // zero-retention quartet (bronze/cowcod/quillback/yelloweye) is an advisory carried
  // on every member's card, never a verdict for the member.
  const prohibited = active.find((r) => r.kind === "prohibited" && r.speciesId === speciesId);
  // Shore-based anglers and spear divers are exempt from RCG-complex season and DEPTH
  // restrictions (CCR T14 §27.20(b)(1)(C)/(D), the rcg-exempt note row). For those
  // platforms the groundfish windows below must not close or condition the card — the
  // note itself lands in specialRules, which is how the card says why.
  // A dated season row that ends before/starts after today means "closed now" UNLESS a
  // platform-matching year-round row also stands (sheephead from shore and by diver).
  const datedSeasons = verdictPool.filter((r) => r.kind === "season" && (r.seasonStart || r.seasonEnd));
  const yearRoundCover = verdictPool.some(
    (r) => r.kind === "season" && !r.seasonStart && !r.seasonEnd,
  );
  const coveringSeason = datedSeasons.filter((r) => inSeasonWindow(r, dateKey));
  const seasonClosedNow =
    datedSeasons.length > 0 && coveringSeason.length === 0 && !yearRoundCover;
  const activeClosedSeason = coveringSeason.find((r) => isClosedNote(r.depthNote));
  const boundarySeason = coveringSeason.find(
    (r) => r.depthNote !== null && !isClosedNote(r.depthNote) && !/all depths/i.test(r.depthNote),
  );
  const inSeasonFlag = active.some((r) => r.checkInseason);

  let verdict: RegulationCard["verdict"];
  let reason: string;
  if (prohibited) {
    verdict = "release";
    reason = "Zero retention — this species may not be taken or possessed.";
  } else if (seasonClosedNow || activeClosedSeason) {
    verdict = "release";
    reason = "Season closed today in this management area.";
  } else if (boundarySeason) {
    verdict = "conditional";
    reason = `Legal only ${boundarySeason.depthNote} today — position against the boundary decides.`;
  } else if (inSeasonFlag) {
    verdict = "conditional";
    reason = "This fishery can change in-season — verify before you keep it.";
  } else {
    verdict = "keep";
    reason = "Open, with the limits shown. You still must verify closures (MPAs and special areas below).";
  }

  const seasonText = coveringSeason.length > 0
    ? coveringSeason.map((r) =>
        r.seasonStart && r.seasonEnd
          ? `${r.seasonStart} → ${r.seasonEnd}${r.depthNote ? ` (${r.depthNote})` : ""}`
          : "Year-round",
      )[0]
    : yearRoundCover
      ? "Year-round"
      : datedSeasons.length > 0
        ? `Closed today (window ${datedSeasons[0].seasonStart} → ${datedSeasons[0].seasonEnd})`
        : "Year-round";

  const sources = [...new Set(active.map((r) => `${r.sourceUrl}|${r.sourceTitle}`))];
  const firstSource = active[0] ?? usable[0];

  return {
    speciesId,
    verdict,
    verdictReason: reason,
    bagDaily: bagRule?.bagDaily ?? null,
    possessionLimit: bagRule?.possessionLimit ?? null,
    minSizeIn: sizeRule?.minSizeIn ?? null,
    maxSizeIn: sizeRule?.maxSizeIn ?? null,
    sizeMeasure: sizeRule?.sizeMeasure ?? null,
    seasonText,
    depthText: boundarySeason?.depthNote ?? pick((r) => r.depthNote),
    specialRules,
    groupNote: groupBag ? groupBag.verbatim : null,
    sourceUrl: sources[0]?.split("|")[0] ?? firstSource.sourceUrl,
    sourceTitle: sources[0]?.split("|")[1] ?? firstSource.sourceTitle,
    sourceUpdatedAt: firstSource.sourceUpdatedAt,
    verifiedAt,
    packVersion: firstSource.packVersion,
    staleDays: Math.max(0, daysSince),
    isStale: daysSince > horizon,
  };
}

/**
 * The one question the angler asks out loud (spec §1): “I am here, today, and I caught
 * this fish — what am I legally allowed to do?”
 */
export function regulationCard(
  pack: SocalPack,
  areaId: string,
  speciesId: string,
  dateKey: string,
  platform: PlatformScope,
): RegulationCard | null {
  const { rules, groups } = rulesForSpecies(pack, areaId, speciesId);
  // Companion-area fold (spec §3): an ocean region and its GMA share a coastline —
  // species bag/size rows live on the ocean region, group season/depth rows on the
  // GMA. Whichever side the caller asked, fold the other side in. The five CDFW GMA
  // settings regions (2026-09-02, "break up California even further") need the
  // reverse direction: ask a GMA, pick up the ocean-size/bag rows.
  const COMPANION_AREA: Record<string, string> = {
    "ca-ocean-southern": "ca-gma-southern",
    "ca-gma-southern": "ca-ocean-southern",
    // The plain Northern California region spans the Northern + Mendocino GMAs;
    // their 2026 windows are identical (CDFW June 2026 table), so Northern GMA's
    // season rows read true for both.
    "ca-ocean-northern": "ca-gma-northern",
    "ca-gma-northern": "ca-ocean-northern",
    "ca-gma-mendocino": "ca-ocean-northern",
    "ca-gma-san-francisco": "ca-ocean-northern",
    "ca-gma-central": "ca-ocean-northern",
  };
  const companion = COMPANION_AREA[areaId];
  const { rules: gmaRules, groups: gmaGroups } =
    companion !== undefined && companion !== areaId
      ? rulesForSpecies(pack, companion, speciesId)
      : { rules: [] as readonly RegRule[], groups: [] as readonly RegGroup[] };
  const allRules = [...rules, ...gmaRules];
  const allGroups = [...groups, ...gmaGroups.filter((g) => !groups.some((x) => x.id === g.id))];
  return buildCard(speciesId, allRules, allGroups, dateKey, platform);
}
