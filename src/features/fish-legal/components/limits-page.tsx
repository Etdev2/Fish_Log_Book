"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useNow } from "@/lib/time/use-now";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { useRegionPreference } from "@/features/settings/region";
import { REGIONS } from "@/core/ontology/regions";
import { useLog } from "@/features/catches/store";
import { keptAudit, limitLines, talliedKeptToday } from "../catch-limits";
import { packForRegion } from "../packs";
import { speciesDisplayName } from "../reg-species";
import { JurisdictionChip } from "./jurisdiction-chip";
import type { LimitLine } from "../catch-limits";

const STATE_COPY: Record<LimitLine["state"], { word: string; tone: string }> = {
  room: { word: "ROOM", tone: "text-success-green" },
  approaching: { word: "APPROACHING", tone: "text-amber-flag" },
  reached: { word: "LEGAL LIMIT REACHED", tone: "text-error-red" },
  over: { word: "OVER THE LIMIT", tone: "text-error-red font-bold" },
};

/**
 * Today's limits (spec §12): "what I'm carrying vs what the day allows", straight from
 * the catches already in the log (disposition 'kept', local day). Numbers never gate the
 * log itself — Fish Legal tells you the truth; you log anyway. Aggregate lines sit on
 * top because an "aggregate 10 in any combination" burns faster than its parts.
 */
export function LimitsPage() {
  const now = useNow();
  const zone = useLocalTimeZone() ?? "America/Los_Angeles";
  const [region] = useRegionPreference();
  const log = useLog();

  const dateKey = useMemo(() => {
    if (now === null) return "2026-01-01";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(Number(now));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }, [now, zone]);

  const bundle = useMemo(() => packForRegion(region), [region]);
  const keptToday = useMemo(
    () => talliedKeptToday(log.catches, dateKey, zone),
    [log.catches, dateKey, zone],
  );
  const lines = useMemo(
    () => (bundle ? limitLines(bundle.data, dateKey, keptToday) : []),
    [bundle, dateKey, keptToday],
  );
  /*
   * The page is called "Today's limits", so it shows today's limits.
   *
   * It used to render only the lines an angler had already retained against, which meant
   * that until you kept something it was an empty page — you could not use it to answer
   * "how many of these am I allowed?", which is the question people open it with, usually
   * while holding the fish. Everything is shown now, with anything you have already kept
   * sorted to the top so a live count is never buried.
   */
  const shown = useMemo(
    () => [...lines].sort((a, b) => b.retained - a.retained),
    [lines],
  );
  const anyRetained = shown.some((l) => l.retained > 0);
  const audit = useMemo(
    () => (bundle ? keptAudit(bundle.data, keptToday) : []),
    [bundle, keptToday],
  );
  const regionLabel = REGIONS.find((r) => r.id === region)?.label ?? "this region";

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-h1">Today&rsquo;s limits</h1>
          <JurisdictionChip prefix="Limits" />
        </div>
        <p className="mt-1 text-caption text-text-muted">
          {dateKey} · {regionLabel} · {bundle ? bundle.jurisdictionLabel : "no verified pack"}
          {" · "}Counts come from kept fish in your log — released fish never enter.
        </p>
      </header>

      {!bundle ? (
        <p className="rounded-lg border border-hairline bg-surface p-4 text-body text-text-muted">
          No verified pack for {regionLabel} yet — limit tracking follows the pack.
        </p>
      ) : null}

      <section className="flex flex-col gap-3" aria-live="polite">
        {!anyRetained && shown.length > 0 ? (
          <p className="rounded-lg border border-hairline bg-surface p-4 text-caption text-text-muted">
            Nothing kept yet today — these are the limits as they stand. Counts fill in the
            moment you log a fish as <em>Kept</em>.
          </p>
        ) : null}

        {shown.length === 0 ? (
          <p className="rounded-lg border border-hairline bg-surface p-4 text-body text-text-muted">
            No limit lines in this pack for today.
          </p>
        ) : (
          shown.map((line) => {
            const copy = STATE_COPY[line.state];
            const label = line.kind === "group" ? line.label : speciesDisplayName(line.id);
            return (
              <article key={line.id} className="rounded-lg border border-hairline bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-h3">
                      <Link
                        href={line.kind === "species" ? `/fish-legal/species/${line.id}` : "/fish-legal/species"}
                        className="underline decoration-dotted underline-offset-4"
                      >
                        {label}
                      </Link>
                    </h2>
                    {line.shareOf ? (
                      <p className="text-caption text-text-muted">{line.shareOf}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className={`text-label font-semibold ${copy.tone}`}>
                      {line.state === "room"
                        ? `${line.retained} of ${line.limit} retained`
                        : `${line.retained} of ${line.limit} — ${copy.word}`}
                    </p>
                  </div>
                </div>
                <div
                  className="mt-3 h-2 w-full rounded-full bg-surface-raised"
                  role="progressbar"
                  aria-label={`${label}: ${line.retained} of ${line.limit} retained today`}
                  aria-valuemin={0}
                  aria-valuemax={line.limit}
                  aria-valuenow={Math.min(line.retained, line.limit)}
                >
                  <div
                    className={`h-2 rounded-full transition-all ${
                      line.state === "room"
                        ? "bg-tide-cyan"
                        : line.state === "approaching"
                          ? "bg-amber-flag"
                          : "bg-error-red-fill"
                    }`}
                    style={{ width: `${Math.min(100, (line.retained / line.limit) * 100)}%` }}
                  />
                </div>
              </article>
            );
          })
        )}
      </section>

      {bundle && audit.length > 0 ? (
        <section aria-label="Kept fish audit" className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">Kept fish audit</h2>
          <p className="mt-1 text-caption text-text-muted">
            Every kept row in today&rsquo;s log, and exactly which line it counts against. A
            fish whose species has no rule in this pack is listed <strong>unmetered</strong> —
            never dropped, never called unlimited.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {audit.map((a) => (
              <li
                key={a.speciesId}
                className="flex items-start justify-between gap-3 rounded-md border border-hairline bg-surface-raised px-3 py-2"
              >
                <div>
                  <p className="text-body font-medium">{speciesDisplayName(a.speciesId)}</p>
                  <p className="text-caption text-text-muted">
                    {a.unmetered
                      ? "UNMETERED — no limit row in this pack counts this species; logged and truthful."
                      : `Counts against: ${a.countsAgainst.join(" + ")}`}
                  </p>
                </div>
                <p className="text-body font-semibold">kept ×{a.kept}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="px-1 text-caption text-text-muted">
        Fish Legal audits the log, never gates it. If a day goes over a limit, the answer
        is honesty upstream (release practice next catch) — never pressure downstream to
        rewrite history.
      </p>
    </div>
  );
}
