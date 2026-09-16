import type { FetchPlan } from "./plan";
import { distanceVerdict } from "./thresholds";
import { isRetryable, type EnrichmentField, type Observation, type Refusal } from "./types";

/**
 * Observations in, one snapshot projection and one status out.
 *
 * `condition_snapshot.enrichment_status` already has the right vocabulary and the schema
 * comment that gives it teeth: "`pending`/`failed` are retried. `unavailable` is
 * TERMINAL: no source covers this place and date, the fields stay null forever, and the
 * retry job must stop asking."
 *
 * This is the function that decides which one a snapshot gets, and getting it wrong costs
 * real money in one direction and real data in the other: a snapshot wrongly marked
 * terminal never gets its numbers, and one wrongly left pending is re-asked forever for a
 * lake that will never have a tide.
 *
 * Pure, per ADR 003. The Swift client reads the same status and must agree about what it
 * means.
 */

export type EnrichmentStatus = "pending" | "partial" | "complete" | "failed" | "unavailable";

export interface MergeResult {
  /** Column name to value, ready for the snapshot row. Only fields that resolved. */
  readonly projection: Readonly<Record<string, number | string>>;
  readonly status: EnrichmentStatus;
  /** Fields worth asking about again. Empty when nothing is retryable. */
  readonly retryFields: readonly EnrichmentField[];
  /** Observations to store, with any distance downgrade already applied. */
  readonly observations: readonly Observation[];
}

/**
 * A value from beyond its trusted radius is kept but relabelled INTERPOLATED; from beyond
 * its maximum it is dropped entirely.
 *
 * The relabel is the point. A tide from 20 km away is still worth having and is not the
 * same claim as one from the gauge in the harbour, and the only honest way to keep both
 * is to say which is which on the row itself.
 */
function applyDistance(observation: Observation): Observation | Refusal {
  const verdict = distanceVerdict(observation.field, observation.distanceToSourceM);
  if (verdict === "TOO_FAR") {
    return {
      field: observation.field,
      reason: "TOO_FAR",
      detail: `nearest source is ${observation.distanceToSourceM} m away`,
    };
  }
  if (verdict === "INTERPOLATED" && observation.kind !== "INTERPOLATED") {
    return { ...observation, kind: "INTERPOLATED" };
  }
  return observation;
}

function isRefusal(value: Observation | Refusal): value is Refusal {
  return "reason" in value;
}

export function mergeObservations(
  plan: FetchPlan,
  incoming: readonly Observation[],
  refusals: readonly Refusal[],
): MergeResult {
  const observations: Observation[] = [];
  const allRefusals: Refusal[] = [...refusals];

  for (const raw of incoming) {
    const checked = applyDistance(raw);
    if (isRefusal(checked)) allRefusals.push(checked);
    else observations.push(checked);
  }

  /*
    Best value per field, where "best" is the closest source and ties go to the first
    arrival. Deliberately NOT "most recent" — a fresh reading from 60 km away describes
    this water worse than an hour-old one from the harbour mouth, and the thresholds above
    are the statement of which distances still mean anything.
  */
  const best = new Map<EnrichmentField, Observation>();
  for (const observation of observations) {
    const held = best.get(observation.field);
    if (held === undefined) {
      best.set(observation.field, observation);
      continue;
    }
    const heldDistance = held.distanceToSourceM ?? 0;
    const newDistance = observation.distanceToSourceM ?? 0;
    if (newDistance < heldDistance) best.set(observation.field, observation);
  }

  const projection: Record<string, number | string> = {};
  for (const [field, observation] of best) {
    // Null is "we looked and there is nothing", which is a refusal, not a value.
    if (observation.value !== null) projection[field] = observation.value;
  }

  const plannedFields = plan.planned.map((p) => p.field);
  const resolved = new Set(best.keys());
  const unresolved = plannedFields.filter((field) => !resolved.has(field));

  const retryFields = unresolved.filter((field) =>
    allRefusals.some((refusal) => refusal.field === field && isRetryable(refusal.reason)),
  );

  return {
    projection,
    status: statusFor(plannedFields.length, resolved.size, unresolved.length, retryFields.length),
    retryFields,
    observations: [...best.values()],
  };
}

/**
 * The five-way decision, written out rather than nested, because each line is a policy.
 */
function statusFor(
  planned: number,
  resolved: number,
  unresolved: number,
  retryable: number,
): EnrichmentStatus {
  /*
    Nothing was even asked for. A freshwater catch with no marine fields in its plan is
    COMPLETE, not unavailable: there was nothing to get and nothing is missing. Marking it
    unavailable would read as a coverage failure on a lake that simply has no tide.
  */
  if (planned === 0) return "complete";

  if (resolved === planned) return "complete";

  /*
    Nothing came back and nothing is worth asking again. This is the terminal case the
    schema comment describes, and the whole reason the distinction exists: the retry job
    must stop. A catch 300 km offshore in 1987 is not going to acquire a tide gauge.
  */
  if (resolved === 0 && retryable === 0) return "unavailable";

  // Nothing yet, but the failures were transport. Still worth the queue.
  if (resolved === 0) return "pending";

  /*
    Some fields landed and some are permanently absent. `partial` is the honest end state
    for a great many real catches and is NOT a failure — `complete` would claim we have
    numbers we do not, which a correlation would later act on.
  */
  if (retryable === 0) return "partial";

  // Some landed, some are still worth asking about. Keep it in the queue as partial.
  return unresolved > 0 ? "partial" : "complete";
}
