/**
 * The event-overlay seam (ADR 006 §6). Not built now — this is the type only.
 *
 * `TideChart` will accept `markers?: readonly TimeAnchoredMarker[]` and render them without
 * knowing what a catch is. `features/catches` will later export a `toTimelineMarkers(...)`
 * that turns catch records into these, and a page composes the two. The type lives in
 * `core/` (rather than in either feature) so neither `features/catches` nor
 * `features/conditions` imports the other's internals (ADR 005 §3).
 */
import type { Instant } from "@/core/units";

export interface TimeAnchoredMarker {
  readonly id: string;
  readonly at: Instant;
  /** Pinned to the curve's height at `at`, or to the time axis regardless of curve value. */
  readonly anchor: "curve" | "axis";
  readonly label: string;
  readonly a11yLabel: string;
  readonly tone: "primary" | "secondary" | "neutral";
}
