"use client";

import { instant } from "@/core/units";
import type { MoonPhase, SunEvents } from "@/core/rules/astro";

import { BottomSheet, SheetRow } from "@/components/bottom-sheet";
import { MoonPhaseVisual } from "./moon-phase-visual";
import { clock, dayLabel, formatLunarAge, formatMoonIllumination, formatMoonPhaseName, zoneAbbreviation } from "../format";

/**
 * The moon, in detail — the card that used to occupy a third of the tide screen.
 *
 * Two rules from `docs/analysis/sun-and-moon.md` govern every word in here, and they are
 * why this sheet is shorter than the brief asked for:
 *
 * §3.1 — the phase NAME is never shown on its own; the illumination percentage always sits
 * next to it, because the engine calls the moon "full" for about 3.7 days.
 *
 * §5 — no "fishing-related lunar information". There is a folk tradition and a plausible
 * mechanism, but the published evidence is thin and confounded, and this app has not shown
 * anything about this user's own catches yet. Any moon-and-fish claim on this screen would
 * be invented. The honest job of this sheet is context, so that is all it does.
 *
 * Moonrise, moonset, and overhead/underfoot are genuinely not computed — the astro engine
 * does three things (sun events, daylight bands, moon phase) and this is not one of them.
 * Saying so is better than a plausible-looking blank row.
 */
export function MoonDetailsSheet({
  open,
  onClose,
  phase,
  at,
  sun,
  displayTimeZone,
}: {
  open: boolean;
  onClose: () => void;
  phase: MoonPhase;
  at: number;
  sun: SunEvents;
  displayTimeZone: string;
}) {
  const zone = zoneAbbreviation(instant(at), displayTimeZone);

  return (
    <BottomSheet open={open} onClose={onClose} eyebrow="Moon" title={formatMoonPhaseName(phase.name)}>
      <div className="app-sheet-moon">
        <MoonPhaseVisual className="app-sheet-moon-visual" id="moon-sheet" phase={phase} />
        <div>
          <p className="app-sheet-moon-illumination">{formatMoonIllumination(phase.illumination)}</p>
          <p className="app-sheet-note">{dayLabel(instant(at), displayTimeZone)}</p>
        </div>
      </div>

      <dl className="app-sheet-rows">
        <SheetRow label="Phase">
          {formatMoonPhaseName(phase.name)} · {formatMoonIllumination(phase.illumination)}
        </SheetRow>
        <SheetRow label="Lunar age">{formatLunarAge(phase.ageDays)}</SheetRow>
        <SheetRow label="Sunrise">{sun.sunrise ? `${clock(sun.sunrise, displayTimeZone)} ${zone}` : "The sun does not rise here today"}</SheetRow>
        <SheetRow label="Sunset">{sun.sunset ? `${clock(sun.sunset, displayTimeZone)} ${zone}` : "The sun does not set here today"}</SheetRow>
        <SheetRow label="First light">{sun.civilDawn ? `${clock(sun.civilDawn, displayTimeZone)} ${zone}` : "—"}</SheetRow>
        <SheetRow label="Last light">{sun.civilDusk ? `${clock(sun.civilDusk, displayTimeZone)} ${zone}` : "—"}</SheetRow>
        <SheetRow label="Moonrise and moonset">Not calculated yet</SheetRow>
      </dl>

      <p className="app-sheet-note">
        Sun and moon times are calculated from the date and the station&rsquo;s position, not measured. They are
        accurate to well under a minute. The moon phase is context for reading the chart — it is not a forecast of
        anything, and this app will not tell you the fish bite on a full moon until your own log says so.
      </p>
    </BottomSheet>
  );
}
