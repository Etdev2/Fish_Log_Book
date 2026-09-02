/**
 * Same-origin proxy to NOAA CO-OPS `datagetter` (ADR: fetch from a Route Handler, not the
 * browser — CORS headers from CO-OPS were never verified from this environment, so a
 * browser-direct fetch would ship an untestable failure mode).
 *
 * Two requests, forwarded raw as `{ hourly, hilo }` — parsing and merging live in
 * `src/features/conditions/queries/tide-wire.ts`, which is pure and unit-tested. This file
 * does I/O only: build the two CO-OPS URLs, fetch them, hand back whatever JSON came back
 * (including CO-OPS's own `{"error":...}` 200-response shape — this route does not
 * interpret it, the caller does).
 *
 * NOT verified against the live endpoint: this sandbox's network policy blocks
 * `api.tidesandcurrents.noaa.gov` outright. Correct by inspection of NOAA's published
 * `datagetter` query parameters; the owner confirms live behaviour on Vercel.
 */
import { NextResponse } from "next/server";

const COOPS_BASE_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const DEFAULT_STATION = "9410580";

/** Fetch from yesterday through a week out, so "now" always sits comfortably inside the
 *  window instead of at its edge. */
function dateRange(): { begin: string; end: string } {
  const toWireDate = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const now = new Date();
  const begin = new Date(now);
  begin.setUTCDate(begin.getUTCDate() - 1);
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + 7);
  return { begin: toWireDate(begin), end: toWireDate(end) };
}

function coopsUrl(station: string, interval: "h" | "hilo"): string {
  const { begin, end } = dateRange();
  const params = new URLSearchParams({
    product: "predictions",
    datum: "MLLW",
    units: "metric",
    time_zone: "gmt",
    format: "json",
    application: "fish_log_book",
    station,
    interval,
    begin_date: begin,
    end_date: end,
  });
  return `${COOPS_BASE_URL}?${params.toString()}`;
}

/** CO-OPS station ids are numeric. Validated rather than passed through so this route can
 *  only ever address a station, whatever arrives in the query string. */
const STATION_ID = /^\d{5,10}$/;

/** NOAA occasionally hangs rather than refusing. Without a deadline this route would hang
 *  with it, and the client's own fallback chain would never get its turn. */
const UPSTREAM_TIMEOUT_MS = 10_000;

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  return res.json();
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get("station");
  if (requested !== null && !STATION_ID.test(requested)) {
    return NextResponse.json({ error: { message: "station must be a numeric CO-OPS station id." } }, { status: 400 });
  }
  const station = requested ?? DEFAULT_STATION;

  try {
    const [hourly, hilo] = await Promise.all([
      fetchJson(coopsUrl(station, "h")),
      fetchJson(coopsUrl(station, "hilo")),
    ]);
    return NextResponse.json({ hourly, hilo });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : "NOAA CO-OPS fetch failed." } },
      { status: 502 },
    );
  }
}
