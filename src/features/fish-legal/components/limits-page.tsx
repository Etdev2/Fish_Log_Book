"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useNow } from "@/lib/time/use-now";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { useRegionPreference } from "@/features/settings/region";
import { REGIONS } from "@/core/ontology/regions";
import { useLog } from "@/features/catches/store";
import { limitLines, talliedKeptToday } from "../catch-limits";
import { packForRegion } from "../packs";
import { speciesDisplayName } from "../reg-species";
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
  const moving = lines.filter((l) => l.retained > 0);
  const regionLabel = REGIONS.find((r) => r.id === region)?.label ?? "this region";

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Today&rsquo;s limits</h1>
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
        {moving.length === 0 ? (
          <p className="rounded-lg border border-hairline bg-surface p-4 text-body text-text-muted">
            Nothing kept in the log yet today. Retained fish appear here the moment you
            log them as <em>Kept</em>.
          </p>
        ) : (
          moving.map((line) => {
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

      <p className="px-1 text-caption text-text-muted">
        Fish Legal audits the log, never gates it. If a day goes over a limit, the answer
        is honesty upstream (release practice next catch) — never pressure downstream to
        rewrite history.
      </p>
    </div>
  );
}
