"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { RCA_50FM_LINE, REG_AREAS } from "../reg-data";
import type { RegArea } from "../types";

/**
 * Resolve a design token to a concrete colour before handing it to Leaflet.
 *
 * Leaflet styles paths with `setAttribute('stroke', …)` / `setAttribute('fill', …)`,
 * i.e. SVG *presentation attributes*. Chromium resolves `var()` there (checked), but
 * that is not a safe assumption on WebKit, and WebKit is the engine this product is
 * aimed at. Resolving here keeps `tokens.json` the single source of truth (ADR 005 §2)
 * without betting the map's legibility on presentation-attribute `var()` support.
 *
 * Plain CSS properties are unaffected — `style.background = "var(--…)"` is safe
 * everywhere and is left as-is below.
 */
function tokenColor(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || `var(${name})`;
}

/**
 * The actual Leaflet surface for BoundaryMap — split out so Next can `ssr:false` it
 * (Leaflet reads `window`). No tile layer**: the pack carries its own geometry, and
 * offshore means no network. An ocean-blue panel with the simplified lines is honest
 * orientation; basemap tiles can layer in later when connectivity exists.
 */
export default function BoundaryLeaflet({
  position,
  layers,
  areas = REG_AREAS as readonly RegArea[],
  center = [33.6, -118.8] as readonly [number, number],
  showRca = true,
}: {
  position: { lat: number; lng: number; accuracy: number } | null;
  layers: { gma: boolean; rca: boolean; cca: boolean; mpa: boolean };
  /** Pack areas to draw (defaults to the SoCal pack). Regions swap this in via props. */
  areas?: readonly RegArea[];
  center?: readonly [number, number];
  showRca?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRefs = useRef<{
    gma?: L.Layer;
    rca?: L.Layer;
    mpa?: L.Layer;
    you?: L.Layer;
    cca: L.Layer[];
  }>({ cca: [] });

  // Build once.
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = L.map(hostRef.current, {
      zoomControl: true,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false, // the page scrolls; two fingers / buttons zoom
      maxZoom: 13,
      minZoom: 7,
    });
    map.setView([center[0], center[1]], center[0] > 27 ? 6 : 8);

    // A plain ocean panel instead of tiles. This is a boundary map, not a chart.
    map.createPane("ocean");
    const oceanPane = map.getPane("ocean")!;
    oceanPane.style.background = "var(--color-map-ocean)";
    hostRef.current.style.background = "var(--color-map-ocean)";

    const gmaArea = areas.find((a) => a.kind === "groundfish_management_area") ?? areas[0];
    layerRefs.current.gma = L.polygon(
      (gmaArea.polygon ?? []).map(([lng, lat]) => [lat, lng] as [number, number]),
      { color: tokenColor("--color-map-boundary-gma"), weight: 2, fillOpacity: 0.08, dashArray: "4 6" },
    )
      .addTo(map)
      .bindTooltip("Southern Management Area (simplified)", { sticky: true });

    if (showRca) {
      layerRefs.current.rca = L.polyline(
        RCA_50FM_LINE.points.map(([lng, lat]) => [lat, lng] as [number, number]),
        { color: tokenColor("--color-map-boundary-rca"), weight: 3, dashArray: "8 6" },
      )
        .addTo(map)
        .bindTooltip("50-fm RCA boundary — simplified waypoints", { sticky: true });
    }

    layerRefs.current.cca = areas
      .filter((a) => a.kind === "conservation_area" && a.polygon)
      .map((area) =>
        L.polygon(
          (area.polygon ?? []).map(([lng, lat]) => [lat, lng] as [number, number]),
          { color: tokenColor("--color-map-area-closed"), weight: 2, fillOpacity: 0.18 },
        )
          .addTo(map)
          .bindTooltip(`${area.name} (simplified)`, { sticky: true }),
      );

    const mpa = areas.find((a) => a.id === "mpa-pt-dume") ?? null;
    if (mpa?.polygon) {
      layerRefs.current.mpa = L.polygon(
        (mpa.polygon ?? []).map(([lng, lat]) => [lat, lng] as [number, number]),
        { color: tokenColor("--color-map-area-protected"), weight: 2, fillOpacity: 0.2 },
      ).bindTooltip(`${mpa.name} (simplified inset)`, { sticky: true });
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Toggle overlays.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const set = (key: "gma" | "rca" | "mpa", on: boolean) => {
      const layer = layerRefs.current[key] as L.Layer | null;
      if (!layer) return;
      if (on) layer.addTo(map);
      else map.removeLayer(layer);
    };
    set("gma", layers.gma);
    set("rca", layers.rca);
    set("mpa", layers.mpa);
    layerRefs.current.cca.forEach((layer) => {
      if (layers.cca) layer.addTo(map);
      else map.removeLayer(layer);
    });
  }, [layers]);

  // You-are-here marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const current = layerRefs.current.you;
    if (current) map.removeLayer(current);
    if (position) {
      const marker = L.circleMarker([position.lat, position.lng], {
        radius: 7,
        color: tokenColor("--color-map-position-stroke"),
        weight: 2,
        fillColor: tokenColor("--color-map-position-fill"),
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip("YOU ARE HERE", { sticky: true });
      const ring = L.circle([position.lat, position.lng], {
        radius: position.accuracy,
        color: tokenColor("--color-map-position-fill"),
        weight: 1,
        fillOpacity: 0.06,
      }).addTo(map);
      layerRefs.current.you = L.layerGroup([marker, ring]);
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 9));
    }
  }, [position]);

  return (
    <div
      ref={hostRef}
      className="h-72 w-full rounded-lg"
      style={{ background: "var(--color-map-ocean)" }}
      aria-label="Boundary map: management area, RCA line, conservation areas, and your position when GPS is on"
    />
  );
}
