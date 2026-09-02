"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useNow } from "@/lib/time/use-now";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { useRegionPreference } from "@/features/settings/region";
import { useLog } from "@/features/catches/store";
import { limitCheckForLog, talliedKeptToday } from "../catch-limits";
import { packForRegion } from "../packs";
import { speciesDisplayName } from "../reg-species";

/**
 * In-form limit warning (spec §12): surfaces ONLY when the fish being logged is kept
 * AND pressing toward a limit that Fish Legal can count. It renders nothing at all
 * otherwise — a silent field is the absence of news, not an all-clear: a species
 * without pack coverage shows no banner by design of `limitCheckForLog`, which is the
 * point of the "View Fish Legal rules" link on every banner.
 *
 * The banner is INFORMATIONAL (role="status" while finessing, role="alert" once the
 * limit is hit); it never blocks the save — the log records the truth even when the
 * truth was over a limit (${'spec §12'} + logbook rule: never gate the diary).
 */
export function LimitBanner({
  speciesId,
  disposition,
  quantity,
}: {
  speciesId: string | null;
  disposition: string | null;
  quantity: number;
}) {
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

  const lines = useMemo(() => {
    if (!speciesId || disposition !== "kept") return [];
    const bundle = packForRegion(region);
    if (!bundle) return [];
    const keptToday = talliedKeptToday(log.catches, dateKey, zone);
    // Project: the fish in hand joins the tally at its quantity.
    keptToday.set(speciesId, (keptToday.get(speciesId) ?? 0) + Math.max(1, quantity));
    return limitCheckForLog(bundle.data, speciesId, keptToday).filter(
      (l) => l.state !== "room",
    );
  }, [speciesId, disposition, quantity, region, log.catches, dateKey, zone]);

  if (lines.length === 0) return null;

  const worst = lines.find((l) => l.state === "over") ?? lines.find((l) => l.state === "reached") ?? lines[0];
  const atLimit = worst.state === "reached" || worst.state === "over";
  const label = worst.kind === "group" ? worst.label : speciesDisplayName(worst.id);

  return (
    <p
      role={atLimit ? "alert" : "status"}
      className={`rounded-md border p-3 text-body ${
        atLimit ? "border-error-red-fill text-error-red font-semibold" : "border-amber-flag text-amber-flag"
      }`}
    >
      {atLimit ? "LEGAL LIMIT REACHED — " : "LIMIT ALERT — "}
      {label}: {worst.retained} of {worst.limit} retained
      {worst.state === "over" ? " (over the limit)" : " today"}.
      {worst.shareOf ? ` (${worst.shareOf}; ${lines.find((l) => l.kind === "group")?.retained ?? 0}/${lines.find((l) => l.kind === "group")?.limit ?? 0} in combination)` : ""}{" "}
      <Link href={`/fish-legal/species/${speciesId}`} className="underline underline-offset-2">
        View rules
      </Link>
    </p>
  );
}
