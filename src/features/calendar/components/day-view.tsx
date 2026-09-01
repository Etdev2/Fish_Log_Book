"use client";

import Link from "next/link";
import { useMemo } from "react";

import { searchable, useLog } from "@/features/catches/store";
import { GEAR_ROLE_LABEL, formatClock, formatDayHeading } from "@/features/catches/format";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { useNow } from "@/lib/time/use-now";
import { localDateKey } from "../calendar-data";

/**
 * One logged day (founder requirements §7: Calendar → Day → Catch).
 *
 * Shows exactly what the log knows: catch times, species (or the amber "needs details"
 * state), the gear attached to each, GPS honesty (real accuracy or "no fix"), and kept /
 * released. It does NOT promise tide or weather it cannot show yet — those join when the
 * conditions snapshot link-up lands. D24's backfill verbs land with the day-flow slice;
 * today a day page is a window into history, plus a door to the tide chart.
 */
export function DayView({ dateKey }: { dateKey: string }) {
  const state = useLog();
  const zone = useLocalTimeZone() ?? "UTC";

  const items = useMemo(() => {
    if (!state.hydrated) return [];
    return searchable(state)
      .filter(({ record }) => localDateKey(Date.parse(record.caught_at), zone) === dateKey)
      .sort((a, b) => Date.parse(a.record.caught_at) - Date.parse(b.record.caught_at));
  }, [state, zone, dateKey]);

  const now = useNow();
  // No clock yet (SSR/first paint): no day is "today". The long-format heading still shows.
  const today = now === null ? "" : localDateKey(Number(now), zone);
  const heading = formatDayHeading(dateKey, today);
  const resolved = items.filter((i) => i.speciesName !== null);
  const pending = items.filter((i) => i.speciesName === null);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/"
        className="inline-flex min-h-touch-floor items-center gap-2 self-start rounded-md text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
      >
        ‹ Calendar
      </Link>

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">{heading}</h1>
        <p className="mt-2 text-caption text-text-muted">
          {dateKey}
          {state.hydrated
            ? items.length === 0
              ? " — no fishing logged"
              : ` — ${resolved.length} ${resolved.length === 1 ? "catch" : "catches"}${
                  pending.length > 0 ? `, ${pending.length} needs details` : ""
                }`
            : ""}
        </p>
      </section>

      {!state.hydrated ? (
        <section className="rounded-lg border border-hairline bg-surface p-4">
          <p className="text-body text-text-muted">Opening your log…</p>
        </section>
      ) : items.length === 0 ? (
        <section className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">Nothing on this day yet.</h2>
          <p className="mt-2 text-body text-text-muted">
            When you log a catch on {formatDayHeading(dateKey, "") === "Today" ? "today" : "this day"}, it lands here
            — time, species, gear, and where you were.
          </p>
          <Link
            href="/log"
            className="mt-4 inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
          >
            Open the Fish Log
          </Link>
        </section>
      ) : (
        <>
          {pending.length > 0 ? (
            <section className="flex flex-col gap-3" aria-labelledby="day-needs-details">
              <h2 id="day-needs-details" className="text-h3 text-amber-flag">
                Needs details
              </h2>
              {pending.map(({ record }) => (
                <DayRow key={record.id} record={record} speciesName="Mark — not told yet" zone={zone} needsDetails />
              ))}
            </section>
          ) : null}
          <section className="flex flex-col gap-3" aria-label="Catches">
            {resolved.map(({ record, speciesName, gear }) => (
              <DayRow key={record.id} record={record} speciesName={speciesName ?? ""} zone={zone} gear={gear} />
            ))}
          </section>
        </>
      )}

      <Link
        href="/tides"
        className="inline-flex min-h-touch-floor items-center justify-center self-start rounded-md border border-border-interactive px-4 text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
      >
        Open tide chart
      </Link>
    </div>
  );
}

function DayRow({
  record,
  speciesName,
  zone,
  gear = [],
  needsDetails = false,
}: {
  record: {
    id: string;
    caught_at: string;
    species_id: string | null;
    species_other: string | null;
    lat: number | null;
    lng: number | null;
    gps_accuracy_m: number | null;
    disposition: "kept" | "released" | "n/a" | null;
  };
  speciesName: string;
  zone: string;
  gear?: readonly { role: string; label: string }[];
  needsDetails?: boolean;
}) {
  const baits = gear.filter((g) => g.role === "bait" || g.role === "lure" || g.role === "jig");
  const gpsText =
    record.lat !== null && record.lng !== null
      ? record.gps_accuracy_m !== null
        ? `GPS ±${Math.round(record.gps_accuracy_m)} m`
        : "GPS fix"
      : "No GPS fix";

  return (
    <article
      className={`rounded-lg border bg-surface p-4 ${
        needsDetails ? "border-amber-flag/60" : "border-hairline"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-h3">{speciesName}</h3>
        <time dateTime={record.caught_at} className="shrink-0 font-mono text-caption text-text-muted">
          {formatClock(record.caught_at, zone)}
        </time>
      </div>
      <p className="mt-1 text-caption text-text-muted">
        {[
          record.disposition && record.disposition !== "n/a" ? record.disposition : null,
          ...baits.map((b) => `${GEAR_ROLE_LABEL[b.role as keyof typeof GEAR_ROLE_LABEL] ?? b.role}: ${b.label}`),
          gpsText,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {needsDetails ? (
        <Link
          href="/log"
          className="mt-2 inline-flex min-h-touch-floor items-center rounded-md text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
        >
          Finish it in the Fish Log →
        </Link>
      ) : null}
    </article>
  );
}
