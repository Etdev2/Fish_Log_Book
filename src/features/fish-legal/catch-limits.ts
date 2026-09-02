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
export function limitLines(
  bundle: RegBundle,
  dateKey: string, // kept for future season-scoped limits; tallies are pre-filtered
  keptToday: ReadonlyMap<string, number>,
): readonly LimitLine[] {
  void dateKey;
  const lines: LimitLine[] = [];

  for (const group of bundle.groups) {
    const memberBag = bundle.rules.find(
      (r) => r.regGroupId === group.id && r.kind === "bag_limit" && r.bagDaily !== null,
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

  for (const rule of bundle.rules) {
    if (!rule.speciesId || rule.kind !== "bag_limit" || rule.bagDaily === null) continue;
    const group = bundle.groups.find((g) => g.memberSpeciesIds.includes(rule.speciesId!));
    lines.push({
      id: rule.speciesId,
      label: rule.speciesId, // UI prettifies via speciesDisplayName
      kind: "species",
      limit: rule.bagDaily,
      retained: keptToday.get(rule.speciesId) ?? 0,
      state: stateOf(keptToday.get(rule.speciesId) ?? 0, rule.bagDaily),
      shareOf: group ? `within the ${group.name} combination` : undefined,
    });
  }

  return lines;
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
