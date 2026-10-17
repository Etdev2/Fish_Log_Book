"use client";

import Link from "next/link";
import { useMemo } from "react";

import { instant } from "@/core/units";
import { moonPhaseAt } from "@/core/rules/astro";
import { readTideAt } from "@/core/rules/tide";
import { speciesLabel } from "@/core/ontology/species";
import { useLog } from "@/features/catches/store";
import { MoonPhaseVisual } from "@/features/conditions/components/moon-phase-visual";
import {
  clock,
  formatDurationMagnitude,
  formatMoonPhaseName,
} from "@/features/conditions/format";
import { STATION_TIME_ZONE } from "@/features/conditions/queries/tide-series";
import { useTideSeries } from "@/features/conditions/queries/use-tide-series";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { usePassport } from "@/features/passport/data";
import { PASSPORT_V1 } from "@/features/passport/flag";
import { fishInMonth, isOnTheWater } from "@/features/home/month-totals";
import { useNow } from "@/lib/time/use-now";

/**
 * Home (founder, 2026-10-16): "remove the calendar off the front page … I want everything
 * to be very engaging."
 *
 * Engaging here means a reason to open the app every time, built only from things that
 * are true: what the water is doing right now, the days you have fished this week, the
 * badge you are closest to, and the fish you just caught. No invented urgency, no nagging
 * and no counters that punish a week off — an angler who did not fish because it blew 30
 * knots should not open the app to a broken streak.
 *
 * Order is the order of a fishing day: log what you caught (the one big button), check
 * the water, see your week, see how close the next badge is, look back at recent fish.
 */

const FOCUS =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";
const CARD = `block rounded-xl border border-hairline bg-surface p-4 transition-colors hover:border-border-interactive active:scale-[0.99] motion-reduce:transition-none ${FOCUS}`;

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const DAY_MS = 86_400_000;

/** "2026-10-16" for an instant, in a zone. The same key catches carry as `local_date`. */
function dateKey(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ms);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function greeting(ms: number, timeZone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(ms),
  );
  if (hour < 5) return "Up early";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeScreen({ setup }: { setup?: React.ReactNode }) {
  const now = useNow();
  const zone = useLocalTimeZone() ?? "UTC";
  const nowMs = now === null ? null : Number(now);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <p className="text-caption text-text-muted">
          {nowMs === null
            ? " "
            : new Intl.DateTimeFormat("en-US", {
                timeZone: zone,
                weekday: "long",
                month: "long",
                day: "numeric",
              }).format(nowMs)}
        </p>
        <h1 className="text-h1">{nowMs === null ? "Welcome back" : greeting(nowMs, zone)}</h1>
      </header>

      <Link
        href="/log?new=1"
        className={`flex min-h-touch-primary-quick-mark items-center justify-center gap-3 rounded-xl bg-signal-orange px-6 text-h3 text-ink-on-orange transition-colors hover:bg-signal-orange-pressed active:scale-95 motion-reduce:transition-none ${FOCUS}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-8">
          <path d="M2 12c3-4 7-5 11-3l4-3v12l-4-3c-4 2-8 1-11-3z" {...STROKE} />
          <circle cx="7" cy="11" r="1" fill="currentColor" />
        </svg>
        Log a catch
      </Link>

      {/* The setup invitation sits under the one action that matters, not above the greeting. */}
      {setup}

      <WaterNow nowMs={nowMs} />
      <YourWeek nowMs={nowMs} zone={zone} />
      {PASSPORT_V1 ? <NextBadge /> : null}
      <RecentCatches zone={zone} />
    </div>
  );
}

/** What the water is doing right now, in words: rising or falling, and the next turn. */
function WaterNow({ nowMs }: { nowMs: number | null }) {
  const tide = useTideSeries();
  const tz = tide.station?.timeZone ?? STATION_TIME_ZONE;

  const reading = useMemo(
    () => (tide.series !== null && nowMs !== null ? readTideAt(tide.series, instant(nowMs)) : null),
    [tide.series, nowMs],
  );
  const moon = useMemo(() => (nowMs === null ? null : moonPhaseAt(instant(nowMs))), [nowMs]);

  const motion = reading?.motion ?? null;
  const headline =
    motion === "rising"
      ? "Tide is coming in"
      : motion === "falling"
        ? "Tide is going out"
        : motion === null
          ? tide.loading
            ? "Checking the tide…"
            : "Tide not available"
          : "Tide is turning";

  const next = reading?.nextTurn ?? null;

  return (
    <Link href="/tides" className={CARD} aria-label={`On the water now: ${headline}. Open the tide chart.`}>
      <p className="text-caption text-text-muted">On the water now{tide.station ? ` · ${tide.station.name}` : ""}</p>
      <div className="mt-2 flex items-center gap-4">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-raised text-tide-cyan"
        >
          <svg viewBox="0 0 24 24" className="size-8">
            {motion === "rising" ? (
              <path d="M12 19V5M5 12l7-7 7 7" {...STROKE} />
            ) : motion === "falling" ? (
              <path d="M12 5v14M5 12l7 7 7-7" {...STROKE} />
            ) : (
              <path d="M2 12c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0" {...STROKE} />
            )}
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-h3 text-text-primary">{headline}</p>
          {/* No height here: a sourced height needs its certainty toggle (ADR 006 §5), and a
              toggle cannot sit inside this card's link. The chart one tap away has it. */}
        </div>
      </div>

      {next !== null && nowMs !== null ? (
        <p className="mt-3 rounded-lg bg-surface-raised px-3 py-2 text-body">
          <span className="font-semibold text-text-primary">
            {next.kind === "high" ? "High tide" : "Low tide"} at {clock(next.at, tz)}
          </span>
          <span className="text-text-muted"> · in {formatDurationMagnitude(Number(next.at) - nowMs)}</span>
        </p>
      ) : null}

      {moon !== null ? (
        <div className="mt-3 flex items-center gap-3 text-body text-text-muted">
          <MoonPhaseVisual id="home-moon" phase={moon} compact className="size-10 shrink-0" />
          <span>{formatMoonPhaseName(moon.name)}</span>
        </div>
      ) : null}

      {tide.stale || tide.source === "fixture" ? (
        <p className="mt-2 text-caption text-amber-flag">Old tide data. Open the chart for details.</p>
      ) : null}
    </Link>
  );
}

/** This week, Monday to Sunday, with a mark on every day you fished. One tap opens the calendar. */
function YourWeek({ nowMs, zone }: { nowMs: number | null; zone: string }) {
  const log = useLog();

  const week = useMemo(() => {
    if (nowMs === null) return null;
    const todayKey = dateKey(nowMs, zone);
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short" }).format(nowMs);
    const offset = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
    // Noon-anchored steps keep each day inside its own date across DST changes.
    const days = Array.from({ length: 7 }, (_, i) => {
      const ms = nowMs + (i - offset) * DAY_MS;
      return {
        key: dateKey(ms, zone),
        letter: new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "narrow" }).format(ms),
        dayOfMonth: new Intl.DateTimeFormat("en-US", { timeZone: zone, day: "numeric" }).format(ms),
      };
    });
    return { todayKey, days };
  }, [nowMs, zone]);

  // A dismissed mis-tap is not a day on the water; a quick mark still is.
  const live = log.catches.filter(isOnTheWater);
  const fishedDays = new Set<string>([
    ...live.map((c) => c.local_date),
    ...log.trips.filter((t) => t.deleted_at === null).map((t) => t.local_date),
  ]);

  const monthPrefix = week?.todayKey.slice(0, 7) ?? "";
  const daysThisMonth = [...fishedDays].filter((d) => d.startsWith(monthPrefix)).length;
  const fishThisMonth = fishInMonth(log.catches, monthPrefix);
  const daysThisWeek = week ? week.days.filter((d) => fishedDays.has(d.key)).length : 0;

  return (
    <Link href="/calendar" className={CARD} aria-label={`Your week: ${daysThisWeek} days fished. Open the calendar.`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h3">Your week</h2>
        <span className="text-caption text-text-link">Calendar ›</span>
      </div>

      <div aria-hidden className="mt-3 grid grid-cols-7 gap-1 text-center">
        {(week?.days ?? []).map((d) => {
          const today = d.key === week?.todayKey;
          const fished = fishedDays.has(d.key);
          return (
            <div key={d.key} className="flex flex-col items-center gap-1">
              <span className="text-caption text-text-muted">{d.letter}</span>
              <span
                className={`flex size-9 items-center justify-center rounded-full text-body font-semibold ${
                  fished
                    ? "bg-signal-orange text-ink-on-orange"
                    : today
                      ? "border-2 border-signal-orange text-text-primary"
                      : "bg-surface-raised text-text-muted"
                }`}
              >
                {d.dayOfMonth}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-body text-text-muted">
        {daysThisMonth === 0 ? (
          "No days on the water yet this month. Today could be the first."
        ) : (
          <>
            <span className="font-semibold text-text-primary">
              {daysThisMonth} {daysThisMonth === 1 ? "day" : "days"}
            </span>{" "}
            on the water this month ·{" "}
            <span className="font-semibold text-text-primary">
              {fishThisMonth} {fishThisMonth === 1 ? "fish" : "fish"}
            </span>
          </>
        )}
      </p>
    </Link>
  );
}

/** The badge or collection you are closest to finishing, with a bar you can watch fill. */
function NextBadge() {
  const { hydrated, nearestGoals, totals } = usePassport();
  if (!hydrated) return null;

  const goal = nearestGoals[0];
  if (goal === undefined) {
    return (
      <Link href="/passport" className={CARD}>
        <h2 className="text-h3">Your Passport</h2>
        <p className="mt-1 text-body text-text-muted">
          {totals.uniqueSpecies === 0
            ? "Every new kind of fish you catch gets a stamp. Your first one is waiting."
            : `${totals.uniqueSpecies} kinds of fish so far. Open it to pick your next goal.`}
        </p>
      </Link>
    );
  }

  const left = goal.target - goal.current;
  const pct = Math.max(4, Math.round((goal.current / goal.target) * 100));

  return (
    <Link href={goal.href} className={CARD}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h3">Next badge</h2>
        <span className="text-caption text-text-muted">
          {goal.current} of {goal.target}
        </span>
      </div>
      <p className="mt-1 text-body text-text-primary">{goal.name}</p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal.target}
        aria-valuenow={goal.current}
        aria-label={goal.name}
        className="mt-3 h-3 overflow-hidden rounded-full bg-surface-raised"
      >
        <div className="h-full rounded-full bg-signal-orange" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-body font-semibold text-signal-orange">
        {left === 1 ? "Just 1 more to go!" : `${left} more to go`}
      </p>
    </Link>
  );
}

/** The last three fish, newest first. */
function RecentCatches({ zone }: { zone: string }) {
  const log = useLog();
  if (!log.hydrated) return null;

  const recent = log.catches
    .filter(isOnTheWater)
    .slice()
    .sort((a, b) => b.caught_at.localeCompare(a.caught_at))
    .slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-label="Recent catches">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h3">Recent catches</h2>
        <Link href="/log" className={`inline-flex min-h-touch-floor items-center text-label text-text-link ${FOCUS}`}>
          See all
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {recent.map((c) => (
          <li key={c.id}>
            <Link
              href={`/catch/${c.id}`}
              className={`flex min-h-touch-floor items-center gap-3 rounded-lg border border-hairline bg-surface px-4 py-3 transition-colors hover:border-border-interactive ${FOCUS}`}
            >
              <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-signal-orange">
                <svg viewBox="0 0 24 24" className="size-6">
                  <path d="M2 12c3-4 7-5 11-3l4-3v12l-4-3c-4 2-8 1-11-3z" {...STROKE} />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label text-text-primary">
                  {speciesLabel(c.species_id, c.species_other) ?? "Fish (needs details)"}
                  {c.quantity > 1 ? ` × ${c.quantity}` : ""}
                </span>
                <span className="block text-caption text-text-muted">
                  {new Intl.DateTimeFormat("en-US", {
                    timeZone: c.caught_tz || zone,
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }).format(Date.parse(c.caught_at))}
                  {c.disposition === "released" ? " · released" : c.disposition === "kept" ? " · kept" : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
