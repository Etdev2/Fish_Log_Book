"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { openTripOf, searchable, useLog } from "@/features/catches/store";
import {
  draftFromRecord,
  updateCatchFromDraft,
  type CatchDraft,
  type PositionRequest,
} from "@/features/catches/create";
import type { UnitSystem } from "@/features/catches/format";
import { activeRodSetups } from "@/core/rules/catch/rules";
import { QuickLogSheet, type LogRequest } from "@/features/catches/components/quick-log-sheet";
import { CatchEnvironmentSection, CatchRecordView } from "@/features/catches/components/catch-record-view";
import { CatchTidePanel } from "@/features/conditions/components/catch-tide-panel";

/**
 * /catch/[id] (founder Historical spec §3): the full record, composed here and nowhere
 * else. This file is the seam between features — the catches feature must never import
 * the conditions feature (the tide panel lives there), so the app route assembles:
 *
 *   record view (catches) + environment section (catches) + tide panel (conditions)
 *
 * Edit reuses the SAME sheet as the fish log, driven by the same update path, so an edit
 * here and an edit there cannot drift apart.
 */
export function CatchDetailClient({
  catchId,
  unitSystem,
}: {
  catchId: string;
  unitSystem: UnitSystem;
}) {
  const state = useLog();
  const [logRequest, setLogRequest] = useState<LogRequest | null>(null);
  const positionRequest = useRef<PositionRequest | null>(null);

  const item = useMemo(() => {
    if (!state.hydrated) return null;
    return searchable(state).find((i) => i.record.id === catchId) ?? null;
  }, [state, catchId]);

  const snapshot = useMemo(() => {
    if (!state.hydrated) return null;
    return (
      state.snapshots.find((s) => s.catch_id === catchId && s.deleted_at === null) ?? null
    );
  }, [state, catchId]);

  const openTrip = useMemo(() => openTripOf(state), [state]);
  const rods = useMemo(
    () => (openTrip ? activeRodSetups(state.rigs, openTrip.id) : []),
    [state.rigs, openTrip],
  );
  const locations = useMemo(
    () =>
      openTrip
        ? state.locations.filter((l) => l.trip_id === openTrip.id && l.deleted_at === null)
        : [],
    [state.locations, openTrip],
  );

  const save = async (draft: CatchDraft) => {
    if (!item) return;
    if (logRequest?.editId === item.record.id) {
      await updateCatchFromDraft(state, item.record, draft);
      setLogRequest(null);
      return;
    }
    // Fallback duplication path should never trigger from this page, but the sheet's
    // save contract still resolves through here.
    setLogRequest(null);
  };

  if (!state.hydrated) {
    return (
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <p className="text-body text-text-muted">Opening the record…</p>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">No such catch</h1>
        <p className="mt-2 text-body text-text-muted">
          This catch is not in the log on this device. It may have been deleted, or it has
          not synced down here.
        </p>
        <Link
          href="/log"
          className="mt-3 inline-flex min-h-touch-floor items-center rounded-md text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
        >
          Back to the Fish Log
        </Link>
      </section>
    );
  }

  const openEdit = () => {
    // Same honesty rule as fish-log: editing never re-fixes the position.
    positionRequest.current = null;
    setLogRequest({
      key: `edit-${item.record.id}`,
      seed: draftFromRecord(
        item.record,
        state.gear,
        snapshot
          ? {
              waterTempC: snapshot.water_temp_c,
              pressureHpa: snapshot.pressure_hpa,
              windSpeedMs: snapshot.wind_speed_ms,
              windDirDeg: snapshot.wind_dir_deg,
            }
          : null,
      ),
      note: "Editing rewrites this catch in place. Its id, its trip, and its moment are kept.",
      title: "Edit catch",
      editId: item.record.id,
    });
  };

  return (
    <>
      <CatchRecordView item={item} unitSystem={unitSystem} onEdit={openEdit} />
      {snapshot ? (
        <CatchEnvironmentSection snapshot={snapshot} unitSystem={unitSystem} />
      ) : null}
      <CatchTidePanel snapshot={snapshot} unitSystem={unitSystem} />
      <QuickLogSheet
        request={logRequest}
        rods={rods}
        locations={locations}
        recentSpeciesIds={[]}
        unitSystem={unitSystem}
        onClose={() => setLogRequest(null)}
        onSave={save}
      />
    </>
  );
}
