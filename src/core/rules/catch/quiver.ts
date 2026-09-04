import { activeRodSetups, nextRodSlot } from "./rules";
import type { RigRecord } from "./types";

/**
 * The Quiver: every rod setup the angler has ever built, one entry per rod (ADR 008).
 *
 * `Put away` has never deleted anything — `retireRodSetup` writes revision n+1 with
 * `retired_at` set, so a fish caught on revision 1 keeps the rod it was actually caught
 * on. What was missing was a way to see those setups again and fish them next trip, and
 * a way to say which revisions are the *same rod*.
 *
 * That is `quiver_id`. Everything here is grouping and arithmetic over it, kept in core
 * so the component never does revision maths — the rule ADR 003 exists for, and the one
 * this feature is most likely to break, because grouping inside a `useMemo` looks
 * harmless right up until the Swift client has to reproduce it.
 *
 * Nothing here mints an id or reads a clock. The caller supplies both, exactly as
 * `repeatSeedFrom` refuses to.
 */

export interface QuiverEntry {
  readonly quiver_id: string;
  /** Highest revision in the lineage — the rod as it was last built. */
  readonly latest: RigRecord;
  /** Already fishing on the current trip, so there is nothing to bring back. */
  readonly in_todays_setup: boolean;
  readonly last_used_at: string;
  /** The angler's own name, or something built from the setup. Never "Rod {slot}". */
  readonly label: string;
}

/**
 * Which lineage a row belongs to.
 *
 * Falls back to trip-and-slot for a row that predates `quiver_id` or arrives from a sync
 * path whose column does not exist yet. After the v3 migration no local row lacks it,
 * but core must stay total rather than trusting that.
 */
export function quiverKeyOf(rig: RigRecord): string {
  return rig.quiver_id && rig.quiver_id.length > 0
    ? rig.quiver_id
    : `${rig.trip_id}:${rig.slot}`;
}

/** Gear roles that make up a rod's identity, in the order the Quiver card reads them. */
const LABEL_ROLES = ["rod", "reel"] as const;

/**
 * A name for a lineage the angler never named.
 *
 * Deliberately NOT `rodSetupLabel`'s "Rod {slot}" fallback: a slot number from a trip
 * three weeks ago means nothing in a saved collection, and two unnamed rods would both
 * read "Rod 1". Built from the setup instead, which is what tells them apart.
 */
function labelFor(latest: RigRecord): string {
  if (latest.name && latest.name.trim().length > 0) return latest.name;

  const parts: string[] = [];
  if (latest.setup_type) parts.push(latest.setup_type);
  for (const role of LABEL_ROLES) {
    const item = latest.gear.find((g) => g.role === role);
    if (item) parts.push(item.detail ? `${item.label}, ${item.detail}` : item.label);
  }
  return parts.length > 0 ? parts.join(" · ") : "Saved rod";
}

/**
 * Every lineage, most recently used first.
 *
 * `tripId` is today's trip, and decides `in_todays_setup` — a rod already being fished
 * cannot be brought back, and the card says so rather than offering a button that would
 * put the same rod on the boat twice.
 */
export function quiverEntries(
  rigs: readonly RigRecord[],
  tripId: string,
): readonly QuiverEntry[] {
  const lineages = new Map<string, RigRecord[]>();
  for (const rig of rigs) {
    const key = quiverKeyOf(rig);
    const existing = lineages.get(key);
    if (existing) existing.push(rig);
    else lineages.set(key, [rig]);
  }

  const activeIds = new Set(activeRodSetups(rigs, tripId).map((rig) => rig.id));

  const entries: QuiverEntry[] = [];
  for (const [quiverId, revisions] of lineages) {
    // Highest revision wins. Retired rows are NOT filtered out first: retiring writes the
    // newest revision, so dropping retired rows and taking the newest of what is left
    // would resurrect a rod that had been put away — the same trap `activeRodSetups`
    // documents.
    const latest = revisions.reduce((a, b) => (b.revision > a.revision ? b : a));
    entries.push({
      quiver_id: quiverId,
      latest,
      in_todays_setup: revisions.some((rig) => activeIds.has(rig.id)),
      last_used_at: latest.effective_from,
      label: labelFor(latest),
    });
  }

  return entries.sort((a, b) => b.last_used_at.localeCompare(a.last_used_at));
}

/**
 * Whether bringing this lineage back is legal.
 *
 * False while the rod is already on today's boat. Without this guard the same rod
 * renders twice in Today's Setup, in two slots, and a catch could be attributed to
 * either.
 */
export function canBringBack(entry: QuiverEntry): boolean {
  return !entry.in_todays_setup;
}

/**
 * The revision that puts a saved rod back on today's boat.
 *
 * Revision n+1 of the same lineage, on today's trip, in a fresh slot, not retired. The
 * previous revision is left exactly as it was: `retired_at` is never cleared, because the
 * rod really was put away then, and a fish logged against that revision must keep saying
 * so.
 */
export function broughtBackRevision(
  latest: RigRecord,
  input: { id: string; tripId: string; slot: number; nowIso: string },
): RigRecord {
  return {
    ...latest,
    id: input.id,
    trip_id: input.tripId,
    slot: input.slot,
    quiver_id: quiverKeyOf(latest),
    revision: latest.revision + 1,
    effective_from: input.nowIso,
    created_at: input.nowIso,
    retired_at: null,
  };
}

/** The slot a brought-back rod takes on today's trip. Re-exported so callers need one import. */
export { nextRodSlot };
