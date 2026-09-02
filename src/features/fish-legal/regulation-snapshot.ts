/**
 * Regulation snapshot stored with each catch (spec §18, "Historical Regulation
 * Snapshot").
 *
 * When a fish is logged, Fish Legal writes what the law said AS OF THAT CATCH: the pack
 * id/version, the verdict the card computed, and the numbers the verdict carried.
 * Rationale the column keeps forever:
 *   - if a bag limit tightens next year, the 2026 yellowtail in the log keeps the 2026
 *     reading (regulations never silently rewrite catch history — the log records what
 *     was true, like every other field);
 *   - stale-pack cards snapshot their stale truth too: `verified_at`'s oldest date is on
 *     the card, so the row later answers "what did we KNOW?" not "what do we say now?";
 *   - rows with no verified data snapshot as null (the pivot stance: silence ≠ proof).
 *
 * Pure data + pure engine in, JSONB column out; synced with the catch (ADR 004 outbox
 * carries it unchanged to PostgREST).
 */
import type { RegionId } from "@/core/ontology/regions";
import { regionPreference } from "@/features/settings/region";
import type { PlatformScope, RegulationCard } from "./types";
import { platformFor } from "./reg-engine";
import { fishingModePreference } from "./prefs";
import { packForRegion } from "./packs";
import { regulationCard } from "./reg-engine";

export interface RegulationSnapshot {
  readonly pack_id: string;
  readonly pack_version: number;
  readonly jurisdiction_label: string;
  readonly verdict: RegulationCard["verdict"];
  readonly verdict_reason: string;
  readonly bag_daily: number | null;
  readonly possession_limit: number | null;
  readonly min_size_in: number | null;
  readonly max_size_in: number | null;
  readonly size_measure: string | null;
  /** Local yyyy-mm-dd the card was evaluated for (the catch's own day). */
  readonly evaluated_date: string;
}

/**
 * What Fish Legal knew when this fish was logged. Nulls are honesty: no verified pack
 * or no verified rule for the species → null, which the schema comment explains as
 * "nothing dated was knowable" — not "fine".
 */
export function buildRegulationSnapshot(
  regionId: RegionId,
  speciesId: string,
  evaluatedDate: string,
  platform: PlatformScope,
): RegulationSnapshot | null {
  const bundle = packForRegion(regionId);
  if (!bundle) return null;
  const card = regulationCard(bundle.data, bundle.primaryAreaId, speciesId, evaluatedDate, platform);
  if (!card) return null;
  return {
    pack_id: bundle.data.pack.id,
    pack_version: bundle.data.pack.version,
    jurisdiction_label: bundle.jurisdictionLabel,
    verdict: card.verdict,
    verdict_reason: card.verdictReason,
    bag_daily: card.bagDaily,
    possession_limit: card.possessionLimit,
    min_size_in: card.minSizeIn,
    max_size_in: card.maxSizeIn,
    size_measure: card.sizeMeasure,
    evaluated_date: evaluatedDate,
  };
}

/** Out-of-React convenience for the log save path: today's mode, today's region. */
export function snapshotForNewCatch(
  speciesId: string | null,
  localDate: string,
): RegulationSnapshot | null {
  if (!speciesId) return null;
  const regionId = regionPreference.read();
  const mode = fishingModePreference.read();
  return buildRegulationSnapshot(regionId, speciesId, localDate, platformFor(mode));
}
