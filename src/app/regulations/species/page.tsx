"use client";

import { useMemo } from "react";

import { useNow } from "@/lib/time/use-now";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { SpeciesBrowser } from "@/features/regulations/components/species-browser";

export default function Page() {
  const now = useNow();
  const zone = useLocalTimeZone() ?? "America/Los_Angeles";
  const dateKey = useMemo(() => {
    if (now === null) return "2026-01-01";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(Number(now));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }, [now, zone]);

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Species &amp; limits</h1>
        <p className="mt-1 text-caption text-text-muted">
          Verdicts for today ({dateKey}) under your current mode. Tap any fish for the full card.
        </p>
      </header>
      <SpeciesBrowser dateKey={dateKey} />
    </div>
  );
}
