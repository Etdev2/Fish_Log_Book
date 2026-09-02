"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { CHIP_CLASS, CHIP_OFF, CHIP_OFF_ON_SURFACE, CHIP_ON } from "@/features/catches/ui-classes";
import { legalAlertPrefs, readInbox, clearInbox, markRead, type LegalAlert, type LegalAlertPrefs } from "../alerts";

const TOGGLES: { key: keyof LegalAlertPrefs; label: string; hint: string }[] = [
  { key: "boundary", label: "Approach alerts", hint: "Heads-up when you near a boundary band (~600 m)." },
  { key: "enteredNoTake", label: "Inside-a-zone alerts", hint: "Conservation areas / no-take zones." },
  { key: "limits", label: "Species limit warnings", hint: "In the log form when a kept fish nears the day's limit." },
  { key: "packUpdates", label: "Rules updates", hint: "When a newer verified pack ships (parity-checked)." },
];

/**
 * Fish Legal alerts (spec §24 + §13's demo lane). The list is the on-device inbox: taps
 * are all devices have offshore; safety-critical copy lives on the regulation cards and
 * never dies with these notifications.
 *
 * Boundary transitions enter this inbox through the GPS watch on the boundaries page —
 * the foldPosition state machine emits exactly one event per transition (spec §14),
 * so the inbox can't turn into a scroll-jack.
 */
export function AlertsPage() {
  const [prefs, setPrefs] = legalAlertPrefs.use();
  const zone = useLocalTimeZone() ?? "America/Los_Angeles";

  // The inbox is external state (localStorage); read live via the changed event the
  // writer dispatches (same plumbing createLocalPreference uses).
  const alerts = useSyncExternalStore(
    (cb) => {
      window.addEventListener("flb:preference-changed:flb:legal-alert-inbox", cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener("flb:preference-changed:flb:legal-alert-inbox", cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => readInbox(),
    () => [] as readonly LegalAlert[],
  );

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Fish Legal alerts</h1>
        <p className="mt-1 text-caption text-text-muted">
          Boundary transitions and limit news, logged on this device. Compliance banners
          on the cards themselves render regardless of these switches (spec §24 — visual
          prominence is never optional).
        </p>
      </header>

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Notification switches</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {TOGGLES.map(({ key, label, hint }) => (
            <li key={key} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-body font-semibold">{label}</p>
                <p className="text-caption text-text-muted">{hint}</p>
              </div>
              <button
                type="button"
                aria-pressed={prefs[key]}
                onClick={() => setPrefs({ ...prefs, [key]: !prefs[key] })}
                className={`${CHIP_CLASS} ${prefs[key] ? CHIP_ON : CHIP_OFF}`}
              >
                {prefs[key] ? "On" : "Off"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h3">Inbox</h2>
          {alerts.length > 0 ? (
            <button type="button" onClick={clearInbox} className={`${CHIP_CLASS} ${CHIP_OFF_ON_SURFACE}`}>
              Clear all
            </button>
          ) : null}
        </div>

        {alerts.length === 0 ? (
          <p className="mt-3 text-body text-text-muted">
            Nothing yet. Transition events land here when GPS is live on the boundary
            page —{" "}
            <Link href="/fish-legal/boundaries" className="text-text-link underline decoration-dotted underline-offset-2">
              open depth &amp; boundaries
            </Link>{" "}
            and turn on the fix.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {alerts.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => markRead(a.id)}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${
                    a.kind === "no_take_zone"
                      ? "border-error-red-fill"
                      : a.kind === "boundary_approached"
                        ? "border-amber-flag"
                        : "border-hairline"
                  } ${a.read ? "opacity-60" : ""}`}
                >
                  <p className="text-body font-semibold">{a.title}</p>
                  <p className="mt-1 text-caption text-text-muted">{a.detail}</p>
                  <p className="mt-1 text-caption text-text-muted">
                    {fmt(a.atIso)}
                    {a.read ? " · acknowledged" : " · tap to acknowledge"} ·{" "}
                    <Link
                      href="/fish-legal/boundaries"
                      onClick={(e) => e.stopPropagation()}
                      className="text-text-link underline decoration-dotted underline-offset-4"
                    >
                      View regulations
                    </Link>
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="px-1 text-caption text-text-muted">
        Fish Legal is an informational aid, never legal advice: regulations change, GPS
        can be wrong, and the agency page wins every disagreement (spec §20).
      </p>
    </div>
  );
}
