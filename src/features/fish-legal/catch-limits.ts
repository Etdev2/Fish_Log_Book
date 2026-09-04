/**
 * Automatic catch-limit tracking (Fish Legal spec §12, §18, Phase 2).
 *
 * Lawful semantics this engine encodes:
 * - a fish COUNTS toward the limit only when `disposition === "kept"` (released fish
 *   never enter the tally; quantity multiplies one row);
 * - the day is the ANGLER's local day (the logbook's own date vocabulary, not UTC);
 * - aggregate/group limits follow the pack's `reg_group` memberships
 *   ("Rockfish Aggregate — 10 in any combination");
 * - species-specific caps inside a group ("copper: 1 within the 10") trip independently
 *   — you can be legal on the combination and illegal on the copper.
 *
 * The law is dated data, so every tally is computed FOR (dateKey, region pack) — same
 * inputs the regulation cards use, same pure functions. The catches in the caller's
 * snapshot are already the durable truth (ADR 004), so this is read-only: writing a
 * catch does not consult the limit engine; the warning is a consequence of a logged
 * reality, never a gate on logging it.
 */
import type { CatchRecord } from "@/core/rules/catch/types";
import type { RegBundle } from "./packs";

export interface SpeciesTally {
  readonly speciesId: string;
  readonly kept: number;
}

export interface LimitLine {
  /** What the law calls the thing being counted. */
  readonly id: string; // species id or group id
  readonly label: string;
  readonly kind: "species" | "group";
  readonly limit: number;
  readonly retained: number;
  /** "room" | "approaching" (retained == limit - 1) | "reached" | "over" */
  readonly state: "room" | "approaching" | "reached" | "over";
  readonly shareOf?: string; // e.g. "within the 10-fish RCG combination"
}

function localDayOf(cat: CatchRecord, zone: string): string {
  const d = new Date(cat.caught_at);
  if (Number.isNaN(d.getTime())) return "invalid";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** All kept-at-species tallies for one local day, straight from the logbook. */
export function talliedKeptToday(
  catches: readonly CatchRecord[],
  dateKey: string,
  zone: string,
): Map<string, number> {
  const tallies = new Map<string, number>();
  for (const c of catches) {
    if (c.deleted_at !== null) continue;
    if (c.disposition !== "kept") continue;
    if (!c.species_id) continue;
    if (localDayOf(c, zone) !== dateKey) continue;
    tallies.set(c.species_id, (tallies.get(c.species_id) ?? 0) + (c.quantity || 1));
  }
  return tallies;
}

/**
 * Project the day's kept tallies onto the pack's limit rules. Both per-species caps and
 * group aggregates are surfaced; everything the pack doesn't limit is silent (no rule =
 * no line, and the absence of a line is NEVER rendered as "unlimited").
 */
/**
 * The bag rule that actually applies on a given day, out of several for one species.
 *
 * Packs legitimately carry more than one: SoCal white seabass is three a day year-round
 * *except* one a day between 15 March and 15 June south of Point Conception, which is two
 * `bag_limit` rules for one fish. Emitting both produced two lines with the same id — a
 * duplicate React key, and worse, a screen showing "3/day" and "1/day" side by side with
 * nothing to say which one is today's. For a feature whose whole job is telling an angler
 * the limit, that is a wrong answer, not a cosmetic bug.
 *
 * Order of preference:
 *   1. A rule whose season window contains today.
 *   2. Otherwise the year-round rule (no window).
 *   3. If still ambiguous, the most restrictive — when the law is unclear the smaller
 *      number is the one that keeps an angler out of trouble.
 */
function appliesOn(rule: { seasonStart: string | null; seasonEnd: string | null }, dateKey: string): boolean {
  if (rule.seasonStart === null || rule.seasonEnd === null) return false;

  // Compared as month-day so a window written with last year's dates still describes this
  // year's season — fishing seasons recur, and the pack's own verifiedAt/staleAfterDays
  // are what catch a genuinely changed rule.
  const md = (iso: string) => iso.slice(5, 10);
  const [today, from, to] = [md(dateKey), md(rule.seasonStart), md(rule.seasonEnd)];

  // A window that runs through the new year (Nov→Feb) reads as from > to.
  return from <= to ? today >= from && today <= to : today >= from || today <= to;
}

function pickBagRule<T extends { seasonStart: string | null; seasonEnd: string | null; bagDaily: number | null }>(
  candidates: readonly T[],
  dateKey: string,
): T | null {
  if (candidates.length === 0) return null;

  const inSeason = candidates.filter((r) => appliesOn(r, dateKey));
  const yearRound = candidates.filter((r) => r.seasonStart === null || r.seasonEnd === null);
  const pool = inSeason.length > 0 ? inSeason : yearRound.length > 0 ? yearRound : candidates;

  return pool.reduce((strictest, r) =>
    (r.bagDaily ?? Infinity) < (strictest.bagDaily ?? Infinity) ? r : strictest,
  );
}

export function limitLines(
  bundle: RegBundle,
  dateKey: string, // kept for future season-scoped limits; tallies are pre-filtered
  keptToday: ReadonlyMap<string, number>,
): readonly LimitLine[] {
  const lines: LimitLine[] = [];

  for (const group of bundle.groups) {
    const memberBag = pickBagRule(
      bundle.rules.filter(
        (r) => r.regGroupId === group.id && r.kind === "bag_limit" && r.bagDaily !== null,
      ),
      dateKey,
    );
    if (!memberBag?.bagDaily) continue;
    const retained = group.memberSpeciesIds.reduce(
      (sum, id) => sum + (keptToday.get(id) ?? 0),
      0,
    );
    lines.push({
      id: group.id,
      label: group.name,
      kind: "group",
      limit: memberBag.bagDaily,
      retained,
      state: stateOf(retained, memberBag.bagDaily),
      shareOf: undefined,
    });
  }

  // One line per species, not one per rule — see pickBagRule.
  const speciesWithBag = [
    ...new Set(
      bundle.rules
        .filter((r) => r.speciesId && r.kind === "bag_limit" && r.bagDaily !== null)
        .map((r) => r.speciesId as string),
    ),
  ];

  for (const speciesId of speciesWithBag) {
    const rule = pickBagRule(
      bundle.rules.filter(
        (r) => r.speciesId === speciesId && r.kind === "bag_limit" && r.bagDaily !== null,
      ),
      dateKey,
    );
    if (!rule?.bagDaily) continue;
    const group = bundle.groups.find((g) => g.memberSpeciesIds.includes(speciesId));
    lines.push({
      id: speciesId,
      label: speciesId, // UI prettifies via speciesDisplayName
      kind: "species",
      limit: rule.bagDaily,
      retained: keptToday.get(speciesId) ?? 0,
      state: stateOf(keptToday.get(speciesId) ?? 0, rule.bagDaily),
      shareOf: group ? `within the ${group.name} combination` : undefined,
    });
  }

  return lines;
}

/**
 * Kept-fish audit (founder report 2026-09-02: "today's limits didn't count my fish").
 * The page shows every kept tally TODAY — each one either names the line it counts
 * against, or is labeled UNMETERED. A kept row never silently disappears: if the pack
 * carries no limit for that species, the page says so in words instead of pretending
 * the fish was never logged.
 */
export interface AuditLine {
  readonly speciesId: string;
  readonly kept: number;
  /** Limit lines this species feeds (species cap and/or group aggregate). */
  readonly countsAgainst: readonly string[];
  /** True when no bag_limit row covers the species directly or via a group. */
  readonly unmetered: boolean;
}

export function keptAudit(bundle: RegBundle, keptToday: ReadonlyMap<string, number>): readonly AuditLine[] {
  return [...keptToday.entries()].map(([speciesId, kept]) => {
    const countsAgainst: string[] = [];
    for (const r of bundle.rules) {
      if (r.speciesId === speciesId && r.kind === "bag_limit" && r.bagDaily !== null) {
        countsAgainst.push(`species cap (${r.bagDaily}/day)`);
      }
    }
    for (const g of bundle.groups) {
      if (!g.memberSpeciesIds.includes(speciesId)) continue;
      const memberBag = bundle.rules.find(
        (r) => r.regGroupId === g.id && r.kind === "bag_limit" && r.bagDaily !== null,
      );
      if (memberBag?.bagDaily) countsAgainst.push(`${g.name} (${memberBag.bagDaily}/day combined)`);
    }
    return { speciesId, kept, countsAgainst, unmetered: countsAgainst.length === 0 };
  });
}

function stateOf(retained: number, limit: number): LimitLine["state"] {
  if (retained > limit) return "over";
  if (retained === limit) return "reached";
  if (retained >= limit - 1) return "approaching";
  return "room";
}

/** The new catch's limit situation: answers the log form's "wait, can I keep this?" */
export function limitCheckForLog(
  bundle: RegBundle,
  speciesId: string,
  keptToday: ReadonlyMap<string, number>,
): readonly LimitLine[] {
  const lines = limitLines(bundle, "", keptToday).filter(
    (l) =>
      l.id === speciesId ||
      (l.kind === "group" &&
        bundle.groups
          .find((g) => g.id === l.id)
          ?.memberSpeciesIds.includes(speciesId)),
  );
  return lines;
}
