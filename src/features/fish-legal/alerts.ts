"use client";

import { createLocalPreference } from "@/features/settings/preference";
import type { BoundaryEvent } from "./boundary-alerts";

/**
 * Fish Legal alerts (spec §24): a device-local event inbox driven by zone transitions,
 * plus the toggles that decide which categories even land. Everything is localStorage
 * — offshore means there is no notification service to call, and when one exists
 * (INP/push) this inbox becomes the "what did I miss" list regardless.
 *
 * Compliance warnings render prominently on Fish Legal pages whether or not these are
 * enabled (spec §24's last sentence) — the toggles govern the ALERT LIST'S arrivals,
 * never the compliance banners on the regulation cards.
 */

export interface LegalAlertPrefs {
  readonly boundary: boolean; // approached / entered conservation areas
  readonly enteredNoTake: boolean; // entered zones whose rules say harvest is prohibited
  readonly limits: boolean; // limit warnings in the log-form (phone UI stays loud regardless)
  readonly packUpdates: boolean; // "new pack verified" nudges
}

export const legalAlertPrefs = createLocalPreference<LegalAlertPrefs>({
  key: "flb:legal-alert-prefs",
  defaultValue: { boundary: true, enteredNoTake: true, limits: true, packUpdates: true },
  parse: (raw) => {
    try {
      const p = raw ? (JSON.parse(raw) as Partial<LegalAlertPrefs>) : null;
      return {
        boundary: p?.boundary !== false,
        enteredNoTake: p?.enteredNoTake !== false,
        limits: p?.limits !== false,
        packUpdates: p?.packUpdates !== false,
      };
    } catch {
      return { boundary: true, enteredNoTake: true, limits: true, packUpdates: true };
    }
  },
  serialize: (value) => JSON.stringify(value),
});

export interface LegalAlert {
  readonly id: string;
  readonly atIso: string;
  readonly kind: "boundary_entered" | "boundary_approached" | "boundary_exited" | "no_take_zone";
  readonly title: string;
  readonly detail: string;
  readonly zoneId: string | null;
  readonly read: boolean;
}

const INBOX_KEY = "flb:legal-alert-inbox";
const MAX_INBOX = 100;

export function readInbox(): readonly LegalAlert[] {
  try {
    const raw = window.localStorage.getItem(INBOX_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as LegalAlert[]).slice(0, MAX_INBOX);
  } catch {
    return [];
  }
}

function writeInbox(alerts: readonly LegalAlert[]): void {
  try {
    window.localStorage.setItem(INBOX_KEY, JSON.stringify(alerts.slice(0, MAX_INBOX)));
    window.dispatchEvent(new CustomEvent("flb:preference-changed:flb:legal-alert-inbox"));
  } catch {
    /* almanac rule applies to alerts too: never let a failed alert drop anything */
  }
}

export function markRead(id: string): void {
  writeInbox(readInbox().map((a) => (a.id === id ? { ...a, read: true } : a)));
}

export function clearInbox(): void {
  writeInbox([]);
}

/**
 * Turn boundary events into alerts if — and only if — the category toggle allows it.
 * "enteredNoTake" zones whose pack has a species-scoped prohibited row under the same
 * area read as NO-TAKE; a plain entrance is a boundary alert. (v1 reads flag semantics
 * from area kind; a purpose-built `severity` column lands with the pack-v2 migration.)
 */
export function ingestBoundaryEvents(events: readonly BoundaryEvent[]): number {
  const prefs = legalAlertPrefs.read();
  const stamped = events.flatMap((e): LegalAlert[] => {
    if (e.kind === "approached" && !prefs.boundary) return [];
    if (e.kind === "exited") return [];
    if (e.kind === "entered" && !prefs.enteredNoTake) return [];
    const kind: LegalAlert["kind"] =
      e.kind === "entered" ? "no_take_zone" : e.kind === "approached" ? "boundary_approached" : "boundary_exited";
    return [
      {
        id: `${e.zoneId}-${e.kind}-${e.atIso}`,
        atIso: e.atIso,
        kind,
        title:
          kind === "no_take_zone"
            ? `NO-TAKE ZONE — ${e.zoneName}`
            : kind === "boundary_approached"
              ? `BOUNDARY ALERT — approaching ${e.zoneName}`
              : `Left ${e.zoneName}`,
        detail:
          kind === "no_take_zone"
            ? "Fishing or retention may be prohibited here. Check the regulations for this area before you fish."
            : kind === "boundary_approached"
              ? `About ${Math.round((e.distanceM ?? 0) / 100) / 10} km out. GPS ±${e.accuracyM ?? "?"} m — orientation-grade, the legal line is the regulation text.`
              : "Zone exit noted; core pack rules apply until another zone boundary crosses.",
        zoneId: e.zoneId,
        read: false,
      },
    ];
  });
  if (stamped.length === 0) return 0;
  writeInbox([...stamped, ...readInbox()]);
  return stamped.length;
}
