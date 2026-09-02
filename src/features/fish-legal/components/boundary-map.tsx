"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { useNow } from "@/lib/time/use-now";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import {
  CHIP_CLASS,
  CHIP_OFF,
  CHIP_ON,
  SECONDARY_BUTTON,
} from "@/features/catches/ui-classes";
import { distanceToLineM, pointInRing, sideOfLine } from "../geospatial";
import { regulationCard } from "../reg-engine";
import { RCA_50FM_LINE, REG_AREAS, SOCAL } from "../reg-data";
import { FLORIDA } from "../florida-pack";
import { NORCAL } from "../norcal-pack";
import { platformFor } from "../reg-engine";
import { useFishingModePreference } from "../prefs";
import { useRegionPreference } from "@/features/settings/region";
import { foldAcrossBundle, type ZoneState } from "../boundary-alerts";
import { ingestBoundaryEvents } from "../alerts";
import { useRef } from "react";

const BoundaryLeaflet = dynamic(() => import("./boundary-leaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-lg border border-hairline bg-surface text-body text-text-muted">
      Drawing the boundary map…
    </div>
  ),
});

/**
 * Depth & boundary rules (founder spec §8, §9, §10): plain English FIRST, the map as
 * orientation, and the legal citation behind "View official rule" — never the other way
 * around. The 50-fm RCA is a coordinate-defined LINE in federal law; what the map shows
 * is the pack's simplified waypoint polyline, marked as such, with CDFW's own
 * interactive map linked for the legal precisions.
 *
 * The ribbon answers today's question out loud ("INSHORE FISHING ONLY", "CLOSED",
 * "OFFSHORE ONLY" for lingcod's October window) from the SAME engine the species cards
 * use — two fronts, one truth.
 */
export function BoundaryMap() {
  const now = useNow();
  const zone = useLocalTimeZone() ?? "America/Los_Angeles";
  const [mode] = useFishingModePreference();
  const platform = platformFor(mode);
  const [position, setPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "asking" | "denied">("idle");
  const [region] = useRegionPreference();
  // Per-zone outside/near/inside state that foldPosition refines fix-by-fix. Lives in a
  // ref — it is not display state — and drives the spec-§14 semantics (transition emits,
  // holding pattern silent).
  const zoneWatches = useRef(new Map<string, ZoneState>());

  const [layers, setLayers] = useState({ gma: true, rca: true, cca: true, mpa: false });

  const dateKey = useMemo(() => {
    if (now === null) return "2026-01-01";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(Number(now));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }, [now, zone]);

  // Founder ask (2026-09-02): California fishes by Groundfish Management Area. The
  // view config pairs each CA region (plain NorCal/SoCal and the five GMA entries)
  // with its bundle, its focus area, and a map center. Regions with no verified
  // California pack keep the Florida overview fallback. The 50-fm RCA ribbon is a
  // Southern-GMA window, so it shows for the two southern reads only.
  const caView = useMemo(() => {
    const isSoCal = region === "southern_california" || region === "ca_gma_southern";
    if (isSoCal) {
      return { bundle: SOCAL, areaId: "ca-gma-southern", areas: REG_AREAS, center: [33.6, -118.8] as const, showRca: true };
    }
    const norcalCenters: Record<string, { areaId: string; center: readonly [number, number] }> = {
      northern_california: { areaId: "ca-gma-northern", center: [39.5, -124.0] },
      ca_gma_northern: { areaId: "ca-gma-northern", center: [40.6, -124.3] },
      ca_gma_mendocino: { areaId: "ca-gma-mendocino", center: [39.5, -123.9] },
      ca_gma_san_francisco: { areaId: "ca-gma-san-francisco", center: [38.0, -123.2] },
      ca_gma_central: { areaId: "ca-gma-central", center: [35.8, -121.8] },
    };
    const nc = norcalCenters[region];
    if (nc) return { bundle: NORCAL, ...nc, areas: NORCAL.areas, showRca: false };
    return null;
  }, [region]);
  const isCalifornia = caView !== null;

  // Today's groundfish reading drives the ribbon — a generic rockfish member's card is
  // the complex's voice this day (boat/shore decides the exemption copy). CA-ONLY:
  // Florida's pack has no 50-fm RCA row, and a Florida page that renders a California
  // season is exactly the hard-coding the expansion spec §3 outlaws.
  const rcgCard = useMemo(
    () =>
      isCalifornia
        ? regulationCard(caView.bundle, caView.areaId, "rockfish", dateKey, platform)
        : null,
    [isCalifornia, caView, dateKey, platform],
  );

  const ribbon = useMemo(() => {
    if (!rcgCard) return null;
    if (rcgCard.verdict === "release")
      return { tone: "closed", text: "GROUNDFISH SEASON CLOSED TODAY", detail: rcgCard.verdictReason };
    if (rcgCard.depthText?.includes("inshore"))
      return { tone: "boundary", text: "INSHORE OF THE 50-FATHOM LINE ONLY", detail: "Rockfish/cabezon/greenlings: take is prohibited seaward of the line today." };
    if (rcgCard.verdict === "conditional")
      return { tone: "boundary", text: "OPEN — VERIFY BEFORE YOU KEEP", detail: rcgCard.verdictReason };
    return { tone: "open", text: "OPEN TODAY (ALL DEPTHS)", detail: "Season windows still apply — check the date you plan for." };
  }, [rcgCard]);

  const where = useMemo(() => {
    if (!position) return null;
    const pt: readonly [number, number] = [position.lng, position.lat];
    const ccaHit = ["cca-santa-barbara", "cca-south"].some((id) => {
      const area = REG_AREAS.find((a) => a.id === id);
      return area?.polygon ? pointInRing(pt, area.polygon as readonly (readonly [number, number])[]) : false;
    });
    // Florida side: IRL catch-and-release zone entry gets the same treatment (its PROHIBITED
    // row is the redfish one; snook/seatrout copy comes from each card's special rules).
    const irlArea = FLORIDA.areas.find((a) => a.id === "fl-irl-cnr")!;
    const inIrl = irlArea.polygon ? pointInRing(pt, irlArea.polygon) : false;
    return {
      rcaSide: caView?.showRca ? sideOfLine(pt, RCA_50FM_LINE.points) : null,
      rcaDistanceM: caView?.showRca ? distanceToLineM(pt, RCA_50FM_LINE.points) : null,
      inCca: ccaHit,
      inIrl,
    };
  }, [position, caView]);

  const watch = () => {
    if (!("geolocation" in navigator)) {
      setGeoState("denied");
      return;
    }
    setGeoState("asking");
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGeoState("idle");
        // Phase 3: every fix folds through every pack-area watch (both packs; spec §15
        // says GPS is jurisdiction-agnostic — "you're fishing in a Florida no-take" must
        // work even when Settings are still California).
        const folded = foldAcrossBundle(
          [...SOCAL.areas, ...NORCAL.areas, ...FLORIDA.areas],
          zoneWatches.current,
          [pos.coords.longitude, pos.coords.latitude],
          new Date(pos.timestamp).toISOString(),
          pos.coords.accuracy ?? null,
        );
        zoneWatches.current = folded.watches;
        ingestBoundaryEvents(folded.events);
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );
    return id;
  };

  // Arm GPS once at mount — deferred a frame so the mount effect isn't a sync setState
  // (react-hooks/set-state-in-effect), and it still just works if GPS is already warm.
  useEffect(() => {
    const raf = requestAnimationFrame(() => watch());
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Depth &amp; boundary rules</h1>
        <p className="mt-1 text-caption text-text-muted">
          Simplified lines for orientation offshore. The federal waypoint text and CDFW&rsquo;s
          official map are the legal reference; both are linked.
        </p>
      </section>

      {ribbon ? (
        <section
          role="status"
          className={`rounded-lg border p-4 ${
            ribbon.tone === "closed"
              ? "border-error-red-fill bg-surface"
              : ribbon.tone === "open"
                ? "border-success-green bg-surface"
                : "border-amber-flag bg-surface"
          }`}
        >
          <p
            className={`text-h3 font-bold ${
              ribbon.tone === "closed"
                ? "text-error-red"
                : ribbon.tone === "open"
                  ? "text-success-green"
                  : "text-amber-flag"
            }`}
          >
            {ribbon.text}
          </p>
          <p className="mt-1 text-body">{ribbon.detail}</p>
          <p className="mt-2 text-caption text-text-muted">
            Read for: {mode === "boat" ? "boat/kayak" : mode} · {dateKey}
            {platform !== "boat" && " · shore/diver exemption applies to RCG seasons"}
          </p>
        </section>
      ) : null}

      {where?.inCca ? (
        <p role="alert" className="rounded-md border border-error-red-fill bg-surface p-4 text-body font-semibold text-error-red">
          You are inside a Cowcod Conservation Area — groundfish fishing is prohibited here.
        </p>
      ) : null}
      {where?.inIrl ? (
        <p role="alert" className="rounded-md border border-error-red-fill bg-surface p-4 text-body font-semibold text-error-red">
          INDIAN RIVER LAGOON — catch &amp; release only (FWC conservation order). Land-based seatrout/redfish/snook harvest is prohibited here.
        </p>
      ) : null}
      {where && !where.inCca && where.rcaDistanceM !== null && where.rcaDistanceM < 900 ? (
        <p role="status" className="rounded-md border border-amber-flag bg-surface p-4 text-body font-semibold text-amber-flag">
          Approaching the 50-fm RCA boundary — about{" "}
          {where.rcaDistanceM < 100
            ? `${Math.round(where.rcaDistanceM)} m`
            : `${(where.rcaDistanceM / 1000).toFixed(1)} km`}{" "}
          away; you read as {where.rcaSide === "inshore" ? "INSHORE (allowed side during Jul–Sep)" : "OFFSHORE (closed side during Jul–Sep)"}.
        </p>
      ) : null}

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">The map (orientation-grade)</h2>
        <fieldset className="mt-2 flex flex-wrap gap-2" aria-label="Map layers">
          {(
            [
              ["gma", "Management area"],
              ["rca", "50-fm RCA boundary"],
              ["cca", "Cowcod areas"],
              ["mpa", "MPA example"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={layers[key]}
              onClick={() => setLayers((l) => ({ ...l, [key]: !l[key] }))}
              className={`${CHIP_CLASS} ${layers[key] ? CHIP_ON : CHIP_OFF}`}
            >
              {layers[key] ? "☑" : "☐"} {label}
            </button>
          ))}
        </fieldset>
        <div className="mt-3">
          <BoundaryLeaflet
            position={position}
            layers={layers}
            areas={caView ? caView.areas : FLORIDA.areas}
            center={caView ? ([caView.center[0], caView.center[1]] as const) : ([26.5, -82.5] as const)}
            showRca={caView?.showRca ?? false}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => watch()} className={SECONDARY_BUTTON}>
            {geoState === "asking" ? "Getting a fix…" : position ? "Refresh position" : "Show me here"}
          </button>
          {geoState === "denied" ? (
            <p className="text-caption text-text-muted">No position available — the map still reads as overview.</p>
          ) : null}
          {position ? (
            <p className="text-caption text-text-muted">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)} · ±{Math.round(position.accuracy)} m
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Which side counts — and other ships</h2>
        <ul className="mt-2 flex flex-col gap-2 text-body">
          <li>• The RCA line is a <em>coordinate boundary</em> (50 CFR 660 waypoints). Your depth sounder does not define it.</li>
          <li>• Eight Groundfish Exclusion Areas also live inside the Southern Management Area; two (the Cowcod blocks) draw here. The rest resolve against the official map.</li>
          <li>• Lingcod keeps its own Oct–Dec OFFSHORE-only window alongside; its species card says so.</li>
          <li>• Shore-based and spear fishing are exempt from RCG season-and-depth rules (CCR T14 §27.20(b)).</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="https://wildlife.ca.gov/OceanSportfishMap" target="_blank" rel="noreferrer" className="text-label text-text-link underline decoration-dotted underline-offset-4">
            CDFW interactive map (official) ↗
          </a>
          <a href="https://www.fisheries.noaa.gov/west-coast/sustainable-fisheries/west-coast-groundfish-closed-areas" target="_blank" rel="noreferrer" className="text-label text-text-link underline decoration-dotted underline-offset-4">
            Federal RCA waypoint definitions ↗
          </a>
        </div>
      </section>
    </div>
  );
}
