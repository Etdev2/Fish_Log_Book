/**
 * Regulations feature types — the offline-legal-reference vocabulary (founder spec
 * "Fishing Regulations, Fish Identification & Offline Legal Reference").
 *
 * Shapes mirror the v1 schema (`20260901230000` reg_pack/reg_area/reg_group/reg_rule)
 * so the pack can move from app bundle to IDB/synced rows without a remodel: these
 * interfaces read the same as the columns. The bundle is the offline floor (ADR 004
 * pattern: speech-first data duplicated in TypeScript, like the species vocabulary).
 */

export type RuleKind =
  | "season"
  | "bag_limit"
  | "possession_limit"
  | "min_size"
  | "max_size"
  | "gear"
  | "prohibited"
  | "note";

export type SizeMeasure = "total_length" | "fork_length" | "alternate_total_length";

/** Founder spec §3 mode selector; CDFW groundfish law only distinguishes boat/shore/diver. */
export type FishingMode = "boat" | "kayak" | "shore" | "spearfishing";
/** The legal platform bucket a mode maps onto. Kayak is a vessel for groundfish purposes. */
export type PlatformScope = "boat" | "shore" | "diver";

export interface RegArea {
  readonly id: string;
  readonly authority: string;
  readonly kind: "ocean_region" | "groundfish_management_area" | "conservation_area";
  readonly name: string;
  /** Simplified WGS84 [lng, lat] outer ring, or null until mapped. Honest about simplification. */
  readonly polygon: readonly (readonly [number, number])[] | null;
  readonly sourceUrl: string;
  readonly verifiedAt: string;
  readonly notes?: string;
}

export interface RegGroup {
  readonly id: string;
  readonly name: string;
  readonly memberSpeciesIds: readonly string[];
}

export interface RegRule {
  readonly id: string;
  readonly speciesId: string | null;
  readonly regGroupId: string | null;
  readonly regAreaId: string;
  readonly kind: RuleKind;
  readonly seasonStart: string | null;
  readonly seasonEnd: string | null;
  readonly bagDaily: number | null;
  readonly possessionLimit: number | null;
  readonly bagSharesWithGroup: boolean;
  readonly minSizeIn: number | null;
  readonly maxSizeIn: number | null;
  readonly sizeMeasure: SizeMeasure | null;
  readonly platformScope: PlatformScope | null;
  readonly depthNote: string | null;
  /** The agency's own sentence. When typed fields and this disagree, this wins. */
  readonly verbatim: string;
  readonly checkInseason: boolean;
  readonly sourceUrl: string;
  readonly sourceTitle: string;
  readonly sourceUpdatedAt: string | null;
  readonly verifiedAt: string;
  readonly staleAfterDays: number;
  readonly packVersion: number;
}

export interface RegPack {
  readonly id: string;
  readonly version: number;
  readonly publishedAt: string;
  readonly notes: string;
}

export interface SocalPack {
  readonly pack: RegPack;
  readonly areas: readonly RegArea[];
  readonly groups: readonly RegGroup[];
  readonly rules: readonly RegRule[];
}

// ---------------------------------------------------------------------------
// What the UI answers with (founder §4 + §15: verdict first, then limits, then law)
// ---------------------------------------------------------------------------

export type KeepVerdict = "keep" | "release" | "conditional";

export interface RegulationCard {
  readonly speciesId: string;
  readonly verdict: KeepVerdict;
  /** One plain sentence the app is willing to stand behind, e.g. "Season closed today". */
  readonly verdictReason: string;
  readonly bagDaily: number | null;
  readonly possessionLimit: number | null;
  readonly minSizeIn: number | null;
  /** Slot upper bound, where the law speaks in slots (Florida seatrout, red drum…). */
  readonly maxSizeIn: number | null;
  readonly sizeMeasure: SizeMeasure | null;
  readonly seasonText: string;
  readonly depthText: string | null;
  readonly specialRules: readonly string[];
  /** Group-combination reading ("5 in any combination of Paralabrax basses"), when the
   *  law speaks in complexes. */
  readonly groupNote: string | null;
  readonly sourceUrl: string;
  readonly sourceTitle: string;
  readonly sourceUpdatedAt: string | null;
  readonly verifiedAt: string;
  readonly packVersion: number;
  /** Founder §23: stale data is still shown, but only ever behind this banner. */
  readonly staleDays: number;
  readonly isStale: boolean;
}
