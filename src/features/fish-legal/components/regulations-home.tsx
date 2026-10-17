"use client";

import { boundaryViewFor, hasBoundaryData } from "../boundary-coverage";
import Link from "next/link";
import { LegalNotice } from "@/components/legal-notice";
import { LegalAcknowledgement } from "@/features/legal/components/legal-acknowledgement";
import { JurisdictionChip } from "./jurisdiction-chip";
import { useMemo, useState } from "react";

import { useNow } from "@/lib/time/use-now";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { REGIONS } from "@/core/ontology/regions";
import { useRegionPreference } from "@/features/settings/region";
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

const FOCUS =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A 24×24 line icon in currentColor. */
function Icon({ children, className = "size-7" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 ${className}`}>
      {children}
    </svg>
  );
}

const MODE_ICON: Record<FishingMode, React.ReactNode> = {
  boat: (
    <>
      <path d="M3 15h18l-3 5H6z" {...STROKE} />
      <path d="M12 4v11M12 5l6 8h-6" {...STROKE} />
    </>
  ),
  kayak: (
    <>
      <path d="M2 14c4 3 16 3 20 0-4-2-16-2-20 0z" {...STROKE} />
      <path d="M5 6l14 12M4 5l2 2M18 17l2 2" {...STROKE} />
    </>
  ),
  shore: (
    <>
      <path d="M2 20c3-2 5-2 8 0s5 2 8 0 3-1 4-1" {...STROKE} />
      <path d="M6 18L18 4M18 4l-1 9" {...STROKE} />
    </>
  ),
  spearfishing: (
    <>
      <path d="M3 21L19 5M19 5l-5 1M19 5l-1 5" {...STROKE} />
      <circle cx="7" cy="9" r="3" {...STROKE} />
    </>
  ),
};

/** One icon per section on the Fish Legal home list. */
const SECTION_ICON = {
  limits: (
    <>
      <path d="M2 12c3-4 7-5 11-3l4-3v12l-4-3c-4 2-8 1-11-3z" {...STROKE} />
      <path d="M20 9v6" {...STROKE} />
    </>
  ),
  cooler: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" {...STROKE} />
      <path d="M3 12h18M9 8V5h6v3" {...STROKE} />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="9" {...STROKE} />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5V14M12 17h.01" {...STROKE} />
    </>
  ),
  fish: (
    <>
      <path d="M2 12c3-4 7-5 11-3l4-3v12l-4-3c-4 2-8 1-11-3z" {...STROKE} />
      <circle cx="7" cy="11" r="1" fill="currentColor" />
    </>
  ),
  whale: (
    <>
      <path d="M3 13c0 4 4 6 9 6 6 0 9-4 9-8l-3 2c-1-3-4-5-8-5-4 0-7 2-7 5z" {...STROKE} />
      <path d="M8 4c0 1.5 1 2.5 2 3M12 3v3" {...STROKE} />
    </>
  ),
  map: (
    <>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" {...STROKE} />
      <path d="M9 4v14M15 6v14" {...STROKE} />
    </>
  ),
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" {...STROKE} />
      <path d="M4 19V5" {...STROKE} />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" {...STROKE} />
      <path d="M10 20a2 2 0 0 0 4 0" {...STROKE} />
    </>
  ),
} as const;

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

  /* "Fri, Oct 16" reads at a glance; 2026-10-16 does not. Same zone as dateKey. */
  const dateLabel = useMemo(
    () =>
      now === null
        ? null
        : new Intl.DateTimeFormat("en-US", {
            timeZone: zone,
            weekday: "short",
            month: "short",
            day: "numeric",
          }).format(Number(now)),
    [now, zone],
  );

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
      <LegalAcknowledgement />

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-h1">Fish Legal</h1>
          <JurisdictionChip prefix="Rules" />
        </div>
        <p className="mt-1 text-body text-text-muted">The fishing rules where you are.</p>
        <div className="mt-3">
          <LegalNotice kind="regulations" />
        </div>
      </section>

      {/*
        Founder, 2026-10-16 ("a five-year-old understands it"): this card used to be a
        "My current regulations" table — Region / Rule set "· pack v2" / an ISO date /
        "Mode" chips that wrapped one to a line. It now answers two plain questions:
        where am I fishing (big, in the accent colour, Change beside it), and how am I
        fishing (four picture buttons). The pack version still shows, small, for the
        people who check sources.
      */}
      <section className="rounded-lg border border-hairline bg-surface p-4" aria-label="Where you are fishing">
        {/* Change sits on the label's line, so a long place name gets the full width below. */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption text-text-muted">You are fishing in</p>
          <Link
            href="/settings"
            className={`inline-flex min-h-touch-floor shrink-0 items-center rounded-md border border-border-interactive px-3 text-label text-text-link transition-colors hover:bg-surface-raised active:scale-95 motion-reduce:transition-none ${FOCUS}`}
          >
            Change
          </Link>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <Icon className="size-8 text-signal-orange">
            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" {...STROKE} />
            <circle cx="12" cy="10" r="2.5" {...STROKE} />
          </Icon>
          <p className="min-w-0 flex-1 text-h2 text-signal-orange">{regionLabel}</p>
        </div>
        <p className="mt-2 text-caption text-text-muted">
          {bundle
            ? `${bundle.jurisdictionLabel} rules for ${dateLabel ?? "today"} · version ${bundle.data.pack.version}`
            : "We don't have checked rules for this place yet."}
        </p>

        <h2 className="mt-5 text-h3">How are you fishing?</h2>
        {/*
          One per row on small phones; two-up, icon over word, from nav-single-row (384px).
          Side-by-side icon + "Spearfishing" does not fit a half-width tile at 390px, and
          a half-width tile of any shape does not fit it at 320px.
        */}
        <ul className="mt-3 grid grid-cols-1 gap-3 nav-single-row:grid-cols-2">
          {(Object.keys(MODE_LABEL) as FishingMode[]).map((m) => {
            const on = mode === m;
            return (
              <li key={m}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMode(m)}
                  className={`relative flex min-h-touch-floor w-full items-center gap-3 rounded-lg border-2 px-3 py-3 text-left text-label transition-colors nav-single-row:flex-col nav-single-row:gap-1 nav-single-row:text-center active:scale-95 motion-reduce:transition-none ${FOCUS} ${
                    on
                      ? "border-signal-orange bg-surface-raised text-text-primary"
                      : "border-hairline bg-background text-text-link"
                  }`}
                >
                  <Icon className={`size-7 ${on ? "text-signal-orange" : ""}`}>{MODE_ICON[m]}</Icon>
                  <span className="min-w-0 flex-1">{MODE_LABEL[m]}</span>
                  {on ? (
                    <span aria-hidden className="text-signal-orange nav-single-row:absolute nav-single-row:right-2 nav-single-row:top-1">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={askGps}
          disabled={geoState === "asking"}
          className={`mt-4 flex min-h-touch-floor w-full items-center justify-center gap-2 rounded-lg border-2 border-border-interactive px-4 text-label text-text-link transition-colors hover:bg-surface-raised active:scale-95 motion-reduce:transition-none ${FOCUS}`}
        >
          <Icon className="size-6">
            <circle cx="12" cy="12" r="3" {...STROKE} />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" {...STROKE} />
          </Icon>
          {geoState === "asking" ? "Finding you…" : position ? "Find me again" : "Find me with GPS"}
        </button>
        {geoState === "denied" ? (
          <p className="mt-2 text-caption text-text-muted">
            Couldn&apos;t find you. The rules below are for {regionLabel}.
          </p>
        ) : null}

        {gpsJurisdiction ? (
          <p className="mt-3 text-caption text-text-muted">
            GPS says you are in {gpsJurisdiction.area.name} ({gpsJurisdiction.pack.jurisdictionLabel}).
          </p>
        ) : null}
        {mismatch ? (
          <p role="alert" className="mt-3 rounded-md border border-amber-flag p-3 text-caption text-amber-flag">
            GPS says {gpsJurisdiction?.pack.jurisdictionLabel}, but you picked {regionLabel}. The
            rules below are for {regionLabel}. Tap Change if that is wrong.
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

      {/*
        One row per section, icon first, title as a question you would actually ask. A
        list rather than a two-up grid: the two-up cards wrapped every title onto two
        lines and every blurb onto three at 390px.
      */}
      <nav aria-label="Regulation sections">
        <ul className="flex flex-col gap-3">
          <HomeRow href="/fish-legal/species" icon={SECTION_ICON.limits} title="How many can I keep?" body="Pick a fish to see its size and bag limit." />
          <HomeRow href="/fish-legal/limits" icon={SECTION_ICON.cooler} title="Count my cooler" body="Check what you have against today's limits." />
          <HomeRow href="/fish-legal/rockfish" icon={SECTION_ICON.question} title="Which rockfish is it?" body="Answer a few questions to narrow it down." />
          <HomeRow href="/fish-id" icon={SECTION_ICON.fish} title="What fish did I catch?" body="Salmon, sand bass and rockfish." />
          <HomeRow href="/fin-id" icon={SECTION_ICON.whale} title="What did I see in the water?" body="Whales and dolphins, and how far to stay back." />
          {/*
            Only offered where we hold published coordinates. This card used to be shown
            everywhere and drew a map of southwest Florida for every non-California region
            (spec §5.3) — offering it and then admitting we have nothing is still better
            than that, but not offering it is better again.
          */}
          {hasBoundaryData(region) ? (
            <HomeRow
              href="/fish-legal/boundaries"
              icon={SECTION_ICON.map}
              title="Where are the lines?"
              body={`${boundaryViewFor(region)?.label ?? ""} depth and closed-area lines.`}
            />
          ) : null}
          <HomeRow href="/fish-legal/offline" icon={SECTION_ICON.book} title="Where do these rules come from?" body="The official sources and when we checked them." />
          <HomeRow href="/fish-legal/alerts" icon={SECTION_ICON.bell} title="My warnings" body="Lines you crossed and limits you got close to." />
        </ul>
      </nav>
    </div>
  );
}

function HomeRow({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex min-h-touch-floor items-center gap-4 rounded-lg border border-border-interactive bg-surface p-4 transition-colors hover:bg-surface-raised active:scale-95 motion-reduce:transition-none ${FOCUS}`}
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-raised text-signal-orange">
          <Icon>{icon}</Icon>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-label text-text-primary">{title}</span>
          <span className="mt-0.5 block text-caption text-text-muted">{body}</span>
        </span>
        <Icon className="size-5 text-text-muted">
          <path d="M9 6l6 6-6 6" {...STROKE} />
        </Icon>
      </Link>
    </li>
  );
}
