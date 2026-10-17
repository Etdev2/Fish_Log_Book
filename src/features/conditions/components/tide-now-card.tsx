"use client";

import Link from "next/link";

import { instant, metres } from "@/core/units";
import { readTideAt } from "@/core/rules/tide";
import { useNow } from "@/lib/time/use-now";
import { useUnitPreference } from "@/features/settings/units";

import { clock, formatDurationMagnitude, formatHeight } from "../format";
import { STATION_TIME_ZONE } from "../queries/tide-series";
import { tideSourceLabel, useTideSeries } from "../queries/use-tide-series";
import { tideNowCopy } from "../tide-now";
import { SourcedValue } from "./sourced-value";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";
const CHART_LINK = `inline-flex min-h-touch-floor items-center justify-center self-start rounded-md border border-border-interactive px-4 text-label text-text-link transition-colors hover:border-tide-cyan ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;

/**
 * What the water is doing now, on the home screen, and the way into the tide chart.
 *
 * Replaces the bare "Open tide chart" button: the angler opening the app on the dock wants
 * the tide before the month grid, so the shortcut now answers the question itself. The
 * calendar below it is untouched and is still the home surface (D23).
 *
 * The staff on the left is the one visual flourish, modelled on the painted tide boards on
 * pier pilings: it fills to where the water sits between the last turn and the next one.
 * It is hidden from screen readers because the sentence beside it says the same thing.
 */
export function TideNowCard() {
  const tide = useTideSeries();
  const now = useNow();
  const [unit] = useUnitPreference();
  const zone = tide.station?.timeZone ?? STATION_TIME_ZONE;

  const reading = tide.series !== null && now !== null ? readTideAt(tide.series, now) : null;
  const copy =
    reading !== null && now !== null
      ? tideNowCopy(reading, Number(now), {
          clock: (ms) => clock(instant(ms), zone),
          height: (m) => formatHeight(metres(m), unit),
          duration: formatDurationMagnitude,
        })
      : null;

  let headline: string;
  let fallback: string | null = null;
  if (copy !== null) {
    headline = copy.headline;
  } else if (tide.loading || now === null) {
    headline = "Reading the tide";
  } else if (tide.series === null) {
    headline = "No tide predictions for this station";
    fallback = "Open the tide chart to pick another station.";
  } else {
    headline = "The saved predictions don't cover today";
    fallback = "Open the tide chart when you have signal to refresh them.";
  }

  return (
    <section aria-labelledby="tide-now" className="flex items-stretch gap-4 rounded-lg border border-hairline bg-surface p-4">
      <TideStaff level={copy?.staffLevel ?? null} />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-caption text-text-muted">{tide.station?.name ?? "Tide"}</p>
        <h2 id="tide-now" className="text-h2">
          {headline}
        </h2>
        {/* Divs, not <p>: SourcedValue's disclosure holds block content of its own. */}
        {reading !== null ? (
          <div className="text-body text-text-muted">
            Water now{" "}
            <SourcedValue
              value={reading.height}
              render={(m) => <span className="text-text-primary">{formatHeight(m, unit)}</span>}
            />
          </div>
        ) : null}
        {copy?.upcoming != null ? <div className="text-body text-text-muted">{copy.upcoming}</div> : null}
        {fallback !== null ? <p className="text-body text-text-muted">{fallback}</p> : null}
        <p className="text-caption text-text-muted">{tideSourceLabel(tide)}</p>
        <Link href="/tides" className={CHART_LINK}>
          Open tide chart
        </Link>
      </div>
    </section>
  );
}

function TideStaff({ level }: { level: number | null }) {
  return (
    <div
      aria-hidden="true"
      className="relative w-3 shrink-0 overflow-hidden rounded-full border border-hairline bg-background"
    >
      {level !== null ? (
        <div className="absolute inset-x-0 bottom-0 bg-tide-cyan" style={{ height: `${level * 100}%` }} />
      ) : null}
    </div>
  );
}
