"use client";

import Link from "next/link";
import { JurisdictionChip } from "./jurisdiction-chip";
import { useMemo, useState } from "react";

import { useNow } from "@/lib/time/use-now";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { REGIONS } from "@/core/ontology/regions";
import { useRegionPreference } from "@/features/settings/region";
import {
  CHIP_CLASS,
  CHIP_OFF,
  CHIP_ON,
  CHIP_OFF_ON_SURFACE,
} from "@/features/catches/ui-classes";
import { pointInRing } from "../geospatial";
import { packForRegion, PACKS } from "../packs";
import { useFishingModePreference } from "../prefs";
import type { FishingMode } from "../types";

const MODE_LABEL: Record<FishingMode, string> = {
  boat: "Boat",
  kayak: "Kayak",
  shore: "Shore",
  spearfishing: "Spearfishing",
};

/**
 * Fish Legal home (expansion spec §3, §15): the header answers "where am I, under what
 * rule set, as of when" — where the law set comes DIRECTLY from the Settings fishing
 * region via `packForRegion`. Change region → the whole surface changes. No pack for the
 * region is an honest, provenance-backed state, never a fake rule.
 *
 * GPS is a tap, never a permission prompt. When it resolves inside a pack polygon we say
 * which jurisdiction the fix landed in — and if it points at a DIFFERENT jurisdiction
 * than the selected region (spec §15's two-location concept), the header says so out
 * loud rather than silently trusting either. That mismatch is exactly the "I'm in
 * Florida but my Settings still say California" moment the spec wants caught.
 */
export function RegulationsHome() {
  const now = useNow();
  const zone = useLocalTimeZone() ?? "America/Los_Angeles";
  const [mode, setMode] = useFishingModePreference();
  const [region] = useRegionPreference();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "asking" | "denied">("idle");

  const dateKey = useMemo(() => {
    if (now === null) return null;
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(Number(now));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }, [now, zone]);

  const bundle = useMemo(() => packForRegion(region), [region]);

  // Where the GPS says the user is, across EVERY pack in the registry — not just the
  // selected one. That is what makes "Settings says X, you are standing in Y" visible.
  const gpsJurisdiction = (() => {
    if (!position) return null;
    for (const pack of PACKS) {
      const hit = pack.data.areas.find(
        (a) =>
          a.polygon &&
          pointInRing(
            [position.lng, position.lat] as readonly [number, number],
            a.polygon as readonly (readonly [number, number])[],
          ),
      );
      if (hit) return { pack, area: hit };
    }
    return null;
  })();

  const regionLabel = REGIONS.find((r) => r.id === region)?.label ?? "Custom / anywhere";
  const mismatch =
    gpsJurisdiction !== null && gpsJurisdiction.pack.regionId !== region;

  const askGps = () => {
    if (!("geolocation" in navigator)) {
      setGeoState("denied");
      return;
    }
    setGeoState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("idle");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-h1">Fish Legal</h1>
          <JurisdictionChip prefix="Rules" />
        </div>
        <p className="mt-1 text-caption text-text-muted">
          Verified rules for where you fish, dated like logbook entries. Legal text one
          tap away; every card says who said it and when we checked.
        </p>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-4" aria-label="My current regulations">
        <h2 className="text-h3">My current regulations</h2>
        <dl className="mt-3 flex flex-col gap-2 text-body">
          <Row label="Region">
            {regionLabel}
            <span className="text-caption text-text-muted">
              {" "}· change it in{" "}
              <Link href="/settings" className="text-text-link underline decoration-dotted underline-offset-2">
                Settings
              </Link>
            </span>
          </Row>
          <Row label="Rule set">
            {bundle
              ? `${bundle.jurisdictionLabel} · pack v${bundle.data.pack.version}`
              : `No verified pack for this region yet`}
          </Row>
          <Row label="Date">{dateKey ?? "…"}</Row>
          <Row label="Mode">
            <ul className="flex flex-wrap gap-2">
              {(Object.keys(MODE_LABEL) as FishingMode[]).map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={`${CHIP_CLASS} ${mode === m ? CHIP_ON : CHIP_OFF}`}
                  >
                    {MODE_LABEL[m]}
                  </button>
                </li>
              ))}
            </ul>
          </Row>
        </dl>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={askGps}
            className={`${CHIP_CLASS} ${CHIP_OFF_ON_SURFACE}`}
            disabled={geoState === "asking"}
          >
            {geoState === "asking" ? "Asking the GPS…" : position ? "Refresh my position" : "Use my GPS"}
          </button>
          {geoState === "denied" ? (
            <p className="text-caption text-text-muted">
              No position this time — the pages answer from the region you selected.
            </p>
          ) : null}
          {position ? (
            <p className="text-caption text-text-muted">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </p>
          ) : null}
        </div>

        {gpsJurisdiction ? (
          <p className="mt-3 text-caption text-text-muted">
            GPS places you in: {gpsJurisdiction.area.name} ({gpsJurisdiction.pack.jurisdictionLabel}).
          </p>
        ) : null}
        {mismatch ? (
          <p role="alert" className="mt-3 rounded-md border border-amber-flag p-3 text-caption text-amber-flag">
            GPS says {gpsJurisdiction?.pack.jurisdictionLabel}, Settings says {regionLabel} —
            answers below follow the SELECTED region. Check Settings if that looks wrong.
          </p>
        ) : null}
      </section>

      {!bundle ? (
        <section className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">No verified data for {regionLabel}</h2>
          <p className="mt-2 text-body text-text-muted">
            Fish Legal only shows regulations it can source, verify, and date. This region
            has no pack yet; when it lands, it arrives as a versioned pack with the
            official source on every rule — never folklore. Today the verified packs are:{" "}
            {PACKS.map((p) => p.jurisdictionLabel).join(" · ")}.
          </p>
        </section>
      ) : null}

      <nav aria-label="Regulation sections" className="grid grid-cols-2 gap-3">
        <HomeCard href="/fish-legal/species" title="Species & limits" body="Pick a fish; get the 2-second answer." />
        <HomeCard href="/fish-legal/limits" title="Today's limits" body="What you're carrying vs. what the day allows." />
        <HomeCard href="/fish-legal/rockfish" title="Rockfish ID" body="Six questions; likely species with confidence, not verdicts." />
        <HomeCard href="/fish-legal/boundaries" title="Depth & boundary rules" body="Lines that change the answer as you move." />
        <HomeCard href="/fish-legal/offline" title="Offline & sources" body="What's on this device, when verified, where the law lives." />
        <HomeCard href="/fish-legal/alerts" title="Fish Legal alerts" body="Boundary transitions & limit warnings, logged on-device." />
      </nav>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-20 shrink-0 text-caption text-text-muted">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

function HomeCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border-interactive bg-surface p-4 transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
    >
      <p className="text-h3">{title}</p>
      <p className="mt-1 text-caption text-text-muted">{body}</p>
    </Link>
  );
}
