/**
 * Pure parse + merge of NOAA CO-OPS `datagetter` payloads into `TidePredictionSample[]`.
 * No I/O in this file — the route handler (`src/app/api/tide/route.ts`) does the fetching,
 * this module only turns whatever JSON it got into the engine's input contract or an
 * honest failure. `TidePredictionSample` (ADR 006 §2) is produced here and never altered
 * downstream.
 *
 * **Response shape below is the team's stated understanding, NOT verified against the
 * live API** (the sandbox this was built in cannot reach `api.tidesandcurrents.noaa.gov`).
 * It is deliberately kept in ONE place — `parseCoOpsPredictions` and the regex in
 * `parseWireTimestamp` — so a correction from a real payload is a one-function fix.
 *
 * Observed/assumed shape, `time_zone=gmt`, `units=metric`:
 *   hourly: {"predictions":[{"t":"2026-09-02 00:00","v":"0.931"}, …]}
 *   hilo:   {"predictions":[{"t":"2026-09-02 03:52","v":"1.847","type":"H"}, …]}
 *   error (HTTP 200!): {"error":{"message":"…"}}
 */
import { instant, metres } from "@/core/units";
import type { TidePredictionSample } from "@/core/rules/tide";

/** One point as CO-OPS sends it. `type` is present only on `interval=hilo` responses. */
export interface CoOpsPrediction {
  readonly t: string;
  readonly v: string;
  readonly type?: "H" | "L";
}

/** The shape of a single CO-OPS `datagetter` JSON response — success or its 200-with-error form. */
export interface CoOpsPredictionsResponse {
  readonly predictions?: readonly CoOpsPrediction[];
  readonly error?: { readonly message?: string };
}

/** What the route handler at `/api/tide` returns: both requests, raw, merged client-side. */
export interface TideWirePayload {
  readonly hourly: unknown;
  readonly hilo: unknown;
}

export type TideWireParseResult =
  | { readonly ok: true; readonly samples: readonly TidePredictionSample[] }
  | { readonly ok: false; readonly reason: string };

/**
 * `t` arrives as `"YYYY-MM-DD HH:MM"` already in UTC (we always request `time_zone=gmt`).
 * Parsed explicitly rather than handed to `new Date()`, which would interpret it as local
 * time in most JS engines and silently shift every sample by the reader's UTC offset.
 */
function parseWireTimestamp(t: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(t);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const ms = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0);
  return Number.isFinite(ms) ? ms : null;
}

type CoOpsResult =
  | { readonly ok: true; readonly samples: readonly TidePredictionSample[] }
  | { readonly ok: false; readonly reason: string };

/**
 * One CO-OPS response (hourly or hilo) → samples. Any single malformed prediction is
 * dropped rather than failing the whole payload; a response that itself carries CO-OPS's
 * `{"error":...}` shape, or isn't the expected object/array shape at all, is a structural
 * failure the caller can fall back from. A well-formed but empty `predictions` array is
 * NOT a structural failure here — the hilo request can legitimately have zero turns in a
 * very short window — so an empty result is valid at this level; only the merged total is
 * required to be non-empty (see `parseTideWirePayload`).
 */
function parseCoOpsPredictions(
  raw: unknown,
  markTurn: (type: CoOpsPrediction["type"]) => "high" | "low" | null,
): CoOpsResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, reason: "CO-OPS response was not a JSON object." };
  }
  const response = raw as CoOpsPredictionsResponse;
  if (response.error) {
    return { ok: false, reason: response.error.message ?? "CO-OPS returned an error." };
  }
  if (!Array.isArray(response.predictions)) {
    return { ok: false, reason: "CO-OPS response had no `predictions` array." };
  }

  const samples: TidePredictionSample[] = [];
  for (const point of response.predictions) {
    if (typeof point !== "object" || point === null) continue;
    const t = (point as CoOpsPrediction).t;
    const v = (point as CoOpsPrediction).v;
    if (typeof t !== "string" || typeof v !== "string") continue;
    const at = parseWireTimestamp(t);
    const height = Number(v);
    if (at === null || !Number.isFinite(height)) continue;
    samples.push({ at: instant(at), height: metres(height), turn: markTurn((point as CoOpsPrediction).type) });
  }

  return { ok: true, samples };
}

/**
 * Merges the hourly curve with the exact hilo turning points into one strictly-ascending,
 * duplicate-free `TidePredictionSample[]` — the shape `tideSeries()` requires (it throws on
 * non-ascending or duplicate `at`). An hourly sample can land on the exact same minute as a
 * turn; when it does, the turn wins (it carries `turn`, the hourly sample does not, and the
 * turn's height is the more precise of the two).
 */
export function parseTideWirePayload(payload: unknown): TideWireParseResult {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, reason: "Malformed tide payload: expected an object with `hourly` and `hilo`." };
  }
  const { hourly, hilo } = payload as Partial<TideWirePayload>;

  const hourlyResult = parseCoOpsPredictions(hourly, () => null);
  if (!hourlyResult.ok) return hourlyResult;

  const hiloResult = parseCoOpsPredictions(hilo, (type) => (type === "H" ? "high" : type === "L" ? "low" : null));
  if (!hiloResult.ok) return hiloResult;

  const byInstant = new Map<number, TidePredictionSample>();
  for (const sample of hourlyResult.samples) byInstant.set(Number(sample.at), sample);
  // Hilo second, so it overwrites any hourly sample sharing the same minute.
  for (const sample of hiloResult.samples) byInstant.set(Number(sample.at), sample);

  const merged = [...byInstant.values()].sort((a, b) => Number(a.at) - Number(b.at));
  if (merged.length === 0) {
    return { ok: false, reason: "Merged tide payload had no usable predictions." };
  }
  return { ok: true, samples: merged };
}
