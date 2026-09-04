"use client";

import Link from "next/link";
import { QuiverSection } from "./quiver-section";
import { useMemo, useState } from "react";

import { activeRodSetups, nextRodSlot, rodSetupLabel } from "@/core/rules/catch/rules";
import type { LocationConditionRecord, RigRecord } from "@/core/rules/catch/types";
import { locationSummary, rodSummary } from "@/features/catches/components/quick-log-sheet";
import {
  currentZone,
  logActions,
  openTripOf,
  startTrip,
  useLog,
} from "@/features/catches/store";
import { CARD_CLASS, FOCUS_RING, PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/features/catches/ui-classes";
import { useUnitPreference } from "@/features/settings/units";
import { SETUP_TYPES } from "../vocabulary";
import { LocationSheet, type LocationRequest } from "./location-sheet";
import { RodSetupSheet, type RodSetupRequest } from "./rod-setup-sheet";

/**
 * Setup — "what am I fishing with, and where?" (spec §4).
 *
 * The page exists so the Fish Log can stay two taps long. Everything configured here is
 * offered as a chip when a fish is logged, and copied onto the catch at that moment.
 *
 * It attaches to the open trip, creating one silently if none is running — the same
 * implicit-trip rule the Fish Log already uses, so an angler never has to think about
 * trips to use either screen.
 */
export function SetupPage() {
  const state = useLog();
  const [unit] = useUnitPreference();
  const [rodRequest, setRodRequest] = useState<RodSetupRequest | null>(null);
  const [locationRequest, setLocationRequest] = useState<LocationRequest | null>(null);
  /** The rod just put away, so the confirmation can say where it went. */
  const [putAway, setPutAway] = useState<string | null>(null);

  const trip = useMemo(() => openTripOf(state), [state]);
  const rods = useMemo(
    () => (trip ? activeRodSetups(state.rigs, trip.id) : []),
    [state.rigs, trip],
  );
  const locations = useMemo(
    () =>
      trip ? state.locations.filter((l) => l.trip_id === trip.id && l.deleted_at === null) : [],
    [state.locations, trip],
  );

  /** Setup is the one screen where opening a trip is the whole point of the tap. */
  const ensureTrip = async (): Promise<string> => {
    if (trip) return trip.id;
    const created = await startTrip({
      startedAt: new Date().toISOString(),
      zone: currentZone(),
      waterClass: "salt",
    });
    return created.id;
  };

  if (!state.hydrated) {
    return (
      <section className={`${CARD_CLASS} p-4`}>
        <h1 className="text-h1">Setup</h1>
        <p className="mt-3 text-body text-text-muted">Loading today&rsquo;s setup…</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={`${CARD_CLASS} flex flex-col gap-2 p-4`}>
        <h1 className="text-h1">Setup</h1>
        <p className="text-body text-text-muted">
          What you are fishing with and where, so logging a fish stays a couple of taps.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-h3">Today&rsquo;s rods</h2>
          <p className="text-caption text-text-muted">
            {rods.length === 0 ? "None yet" : `${rods.length} rigged`}
          </p>
        </div>

        {/* Putting a rod away has never deleted it, but a bare button with no follow-up
            reads as final. Naming where it went is the fix — not a confirmation dialog,
            which would tax every angler to guard against a mistake that costs one tap. */}
        {putAway ? (
          <p role="status" className="text-body text-text-muted">
            Put away — saved in your Quiver.
          </p>
        ) : null}

        <ul className="flex flex-col gap-2">
          {rods.map((rod) => (
            <li key={rod.id}>
              <RodCard
                rod={rod}
                onEdit={() =>
                  setRodRequest({ key: `rod-${rod.id}`, slot: rod.slot, existing: rod })
                }
                onRetire={() => {
                  void logActions.retireRodSetup(rod.id);
                  setPutAway(rod.id);
                }}
              />
            </li>
          ))}
        </ul>

        {rods.length === 0 ? (
          <p className="text-body text-text-muted">
            Add the rods you have out today. Each one remembers its line, leader, hook and
            bait, so a caught fish only needs a tap.
          </p>
        ) : null}

        <button
          type="button"
          onClick={async () => {
            await ensureTrip();
            setRodRequest({
              key: `rod-new-${Date.now()}`,
              slot: nextRodSlot(state.rigs, trip?.id ?? ""),
              existing: null,
            });
          }}
          className={`${PRIMARY_BUTTON} self-start`}
        >
          + Add rod
        </button>
      </section>

      {/* Directly under the rods, because that is where a rod goes when you put it away
          and where it comes back to (design 12 §2.1). */}
      <QuiverSection rigs={state.rigs} tripId={trip?.id ?? ""} onEnsureTrip={ensureTrip} />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-h3">Location &amp; Conditions</h2>
          <p className="text-caption text-text-muted">
            {locations.length === 0 ? "None yet" : `${locations.length} set up`}
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {locations.map((location) => (
            <li key={location.id}>
              <LocationCard
                location={location}
                onEdit={() =>
                  setLocationRequest({ key: `loc-${location.id}`, existing: location })
                }
              />
            </li>
          ))}
        </ul>

        {locations.length === 0 ? (
          <p className="text-body text-text-muted">
            Add the spots you are fishing and what you see there — current, structure,
            water. Logged fish copy those conditions as they were at the time.
          </p>
        ) : null}

        <button
          type="button"
          onClick={async () => {
            await ensureTrip();
            setLocationRequest({ key: `loc-new-${Date.now()}`, existing: null });
          }}
          className={`${PRIMARY_BUTTON} self-start`}
        >
          + Add location
        </button>
      </section>

      {/* Step 2 of the founder's workflow, reachable from the hub rather than buried in
          Settings — but a link card, not a section, because Setup does not own the
          Tackle Box's content (design 12 §2.5). */}
      <section className={`${CARD_CLASS} flex flex-col gap-2 p-4`}>
        <h2 className="text-h3">Tackle Box</h2>
        <p className="text-body text-text-muted">
          Everything in your kit — rods, reels, line, hooks, and more.
        </p>
        <Link href="/tackle" className={`${SECONDARY_BUTTON} self-start`}>
          Open Tackle Box
        </Link>
      </section>

      <RodSetupSheet
        request={rodRequest}
        onClose={() => setRodRequest(null)}
        onSave={async (input) => {
          const tripId = await ensureTrip();
          await logActions.saveRodSetup({ ...input, tripId, depthM: null });
          setRodRequest(null);
        }}
      />

      <LocationSheet
        request={locationRequest}
        tripId={trip?.id ?? ""}
        depthUnit={unit === "m" ? "m" : "ft"}
        onClose={() => setLocationRequest(null)}
        onSave={async (input, id) => {
          const tripId = await ensureTrip();
          await logActions.saveLocation({ ...input, trip_id: tripId }, id);
          setLocationRequest(null);
        }}
        onDelete={async (id) => {
          await logActions.deleteLocation(id);
          setLocationRequest(null);
        }}
      />
    </div>
  );
}

function RodCard({
  rod,
  onEdit,
  onRetire,
}: {
  rod: RigRecord;
  onEdit: () => void;
  onRetire: () => void;
}) {
  const summary = rodSummary(rod);
  const type = SETUP_TYPES.find((t) => t.id === rod.setup_type)?.label ?? null;

  return (
    <div className={`${CARD_CLASS} flex flex-col gap-2 p-4`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-h3">{rodSetupLabel(rod)}</h3>
        <span className="shrink-0 text-caption text-text-muted">Rod {rod.slot}</span>
      </div>
      {type ? <p className="text-body text-text-primary">{type}</p> : null}
      {summary ? <p className="text-caption text-text-muted">{summary}</p> : null}
      {rod.live_bait ? <p className="text-caption text-text-muted">Live bait</p> : null}
      {rod.revision > 1 ? (
        <p className="text-caption text-text-muted">
          Version {rod.revision} — earlier fish keep the setup they were caught on
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className={SECONDARY_BUTTON}>
          Re-rig
        </button>
        <button type="button" onClick={onRetire} className={`${SECONDARY_BUTTON} ${FOCUS_RING}`}>
          Put away
        </button>
      </div>
    </div>
  );
}

function LocationCard({
  location,
  onEdit,
}: {
  location: LocationConditionRecord;
  onEdit: () => void;
}) {
  const summary = locationSummary(location);
  return (
    <button
      type="button"
      onClick={onEdit}
      className={`${CARD_CLASS} ${FOCUS_RING} flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-surface-raised active:scale-[0.99] motion-reduce:transition-none`}
    >
      <h3 className="text-h3">{location.name}</h3>
      {summary ? <p className="text-body text-text-primary">{summary}</p> : null}
    </button>
  );
}
