"use client";

import Link from "next/link";
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
import { pointInRing, sideOfLine } from "../geospatial";
import { REG_AREAS, RCA_50FM_LINE, SOCAL } from "../reg-data";
import { useFishingModePreference } from "../prefs";
import type { FishingMode } from "../types";

const MODE_LABEL: Record<FishingMode, string> = {
  boat: "Boat",
  kayak: "Kayak",
  shore: "Shore",
  spearfishing: "Spearfishing",
};

/**
 * Regulations home (founder spec §2): the header answers "where am I, under what rule
 * set, as of when" before anything else, and the cards go where an angler a-float
 * actually points. GPS is a TAP, never a surprise permission prompt — the manual/home
 * region stands in when location is off or unavailable (§3).
 *
 * None of this reads the network: the SoCal pack is bundled, the position question is
 * `pointInRing`, and the day comes from `useNow` in the device's zone. If we're outside
 * every mapped polygon we say exactly that and fall back to the home region.
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

  const area = useMemo(() => {
    if (position) {
      const hit = REG_AREAS.find(
        (a) =>
          a.kind !== "conservation_area" &&
          a.polygon &&
          pointInRing([position.lng, position.lat], a.polygon),
      );
      if (hit) return { source: "gps", area: hit } as const;
      return null;
    }
    // Home-region fallback: southern_california is the only region this pack covers,
    // and the pack says so rather than pretending.
    if (region === "southern_california") {
      return { source: "home region", area: REG_AREAS.find((a) => a.id === "ca-gma-southern")! } as const;
    }
    return null;
  }, [position, region]);

  const rcaSide = useMemo(() => {
    if (!position) return null;
    const insideGma = area?.source === "gps";
    if (!insideGma) return null;
    return sideOfLine([position.lng, position.lat], RCA_50FM_LINE.points);
  }, [position, area]);

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
        <h1 className="text-h1">Regulations &amp; Fish ID</h1>
        <p className="mt-1 text-caption text-text-muted">
          Verified rules for where you are, dated like logbook entries. Legal text always
          one tap away; complete trust details on every card.
        </p>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-4" aria-label="My current regulations">
        <h2 className="text-h3">My current regulations</h2>
        <dl className="mt-3 flex flex-col gap-2 text-body">
          <Row label="Fishing at">
            {area ? `${area.area.name}` : "Outside the areas this pack covers"}
            {area ? (
              <span className="text-caption text-text-muted">
                {" "}({area.source === "gps" ? "from your GPS" : "home region — turn on GPS for precision"})
              </span>
            ) : null}
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
          <Row label="Dataset">
            SoCal pack v{SOCAL.pack.version} · verified {SOCAL.pack.publishedAt.slice(0, 10)}
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
              No position this time — the pages still answer from your home region (
              {REGIONS.find((r) => r.id === region)?.label}).
            </p>
          ) : null}
          {position ? (
            <p className="text-caption text-text-muted">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              {rcaSide ? ` — ${rcaSide === "inshore" ? "inshore of" : "offshore of"} the 50-fm RCA line` : ""}
            </p>
          ) : null}
        </div>
      </section>

      <nav aria-label="Regulation sections" className="grid grid-cols-2 gap-3">
        <HomeCard href="/regulations/species" title="Species & limits" body="Pick a fish; get the 2-second answer." />
        <HomeCard href="/regulations/rockfish" title="Rockfish ID" body="Six easy questions; likely species with confidence, not verdicts." />
        <HomeCard href="/regulations/boundaries" title="Depth & boundary rules" body="Today's 50-fm season, RCAs, MPAs — with the map." />
        <HomeCard href="/regulations/offline" title="Offline & sources" body="What's on this device, when verified, where the law lives." />
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
