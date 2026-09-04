"use client";

import { useMemo, useState } from "react";

import { canBringBack, quiverEntries, type QuiverEntry } from "@/core/rules/catch/quiver";
import type { GearRole, RigRecord } from "@/core/rules/catch/types";
import { CARD_CLASS, PRIMARY_BUTTON } from "@/features/catches/ui-classes";
import { logActions } from "@/features/catches/store";

/**
 * The Quiver — every rod setup the angler has ever built, ready to fish again.
 *
 * `Put away` has never deleted a rod; it writes a retired revision so a fish keeps the
 * setup it was caught on. What was missing was anywhere to see those setups and a way to
 * bring one back, which is what made "Put away" read as destructive.
 *
 * Every grouping and revision decision is in `core/rules/catch/quiver.ts`. This component
 * renders and calls one action — no `useMemo` that quietly re-implements the lineage
 * rules, which is the failure ADR 003 exists to prevent.
 */

/** The founder's own words for a rod's parts (spec §2), not the internal role keys. */
const GEAR_ROWS: readonly { role: GearRole; label: string }[] = [
  { role: "rod", label: "Rod" },
  { role: "reel", label: "Reel" },
  { role: "main_line", label: "Line" },
  { role: "leader", label: "Leader" },
  { role: "hook", label: "Hooks" },
  { role: "bait", label: "Bait" },
  { role: "weight", label: "Weight" },
  { role: "terminal", label: "Terminal tackle" },
];

export function QuiverSection({
  rigs,
  tripId,
  onEnsureTrip,
}: {
  rigs: readonly RigRecord[];
  tripId: string;
  /** Bringing a rod back needs a trip to bring it back to. */
  onEnsureTrip: () => Promise<string>;
}) {
  const entries = useMemo(() => quiverEntries(rigs, tripId), [rigs, tripId]);
  const [broughtBack, setBroughtBack] = useState<string | null>(null);

  async function bringBack(entry: QuiverEntry) {
    const trip = await onEnsureTrip();
    await logActions.bringBackRodSetup(entry.quiver_id, trip);
    setBroughtBack(entry.quiver_id);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h3">Quiver</h2>
        <p className="text-caption text-text-muted">
          {entries.length === 0
            ? "Nothing saved yet"
            : `${entries.length} saved`}
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-body text-text-muted">
          Nothing saved yet. Put a rod away from Today&rsquo;s Setup and it lands here,
          ready to bring back next trip — nothing you build today has to be rebuilt
          tomorrow.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.quiver_id}>
              <QuiverCard
                entry={entry}
                justBroughtBack={broughtBack === entry.quiver_id}
                onBringBack={() => void bringBack(entry)}
                onUndo={() => {
                  const active = entry.latest;
                  void logActions.retireRodSetup(active.id);
                  setBroughtBack(null);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function QuiverCard({
  entry,
  justBroughtBack,
  onBringBack,
  onUndo,
}: {
  entry: QuiverEntry;
  justBroughtBack: boolean;
  onBringBack: () => void;
  onUndo: () => void;
}) {
  const rows = GEAR_ROWS.map(({ role, label }) => {
    const item = entry.latest.gear.find((g) => g.role === role);
    if (!item) return null;
    return { label, value: item.detail ? `${item.label}, ${item.detail}` : item.label };
  }).filter((row): row is { label: string; value: string } => row !== null);

  return (
    <div className={`${CARD_CLASS} flex flex-col gap-2 p-4`}>
      <h3 className="text-h3">{entry.label}</h3>

      {/* Labelled rows, not the terse summary the active rod card uses: here the angler
          is scanning several saved setups weeks later, not glancing at the one in their
          hand. A gear role that was never set is omitted, never shown as a blank. */}
      {rows.length > 0 ? (
        <dl className="flex flex-col gap-1">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-3 text-body">
              <dt className="w-24 shrink-0 text-caption text-text-muted">{row.label}</dt>
              <dd className="min-w-0 flex-1 text-text-primary">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {entry.latest.live_bait ? (
        <p className="text-caption text-text-muted">Live bait</p>
      ) : null}

      {canBringBack(entry) ? (
        <button type="button" onClick={onBringBack} className={`${PRIMARY_BUTTON} w-full`}>
          Bring back to Today&rsquo;s Setup
        </button>
      ) : justBroughtBack ? (
        /* Confirms where it went and offers the one correction worth having. A greyed-out
           button an angler pokes at twice in the sun is worse than no button, so the
           already-there case below is a plain line instead. */
        <div className="flex items-center justify-between gap-3">
          <p className="text-body text-text-muted">Back in Today&rsquo;s Setup.</p>
          <button
            type="button"
            onClick={onUndo}
            className="inline-flex min-h-touch-floor items-center rounded-full px-3 text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
          >
            Undo
          </button>
        </div>
      ) : (
        <p className="text-body text-text-muted">Already in Today&rsquo;s Setup.</p>
      )}
    </div>
  );
}
