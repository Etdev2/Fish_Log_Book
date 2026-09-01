"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { activeRodSetups, repeatSeedFrom } from "@/core/rules/catch/rules";
import {
  filterCatches,
  groupByLocalDate,
  NO_FILTERS,
  type CatchFilters,
  type LogView,
  type SearchableCatch,
} from "@/core/rules/catch/search";
import {
  attachPositionLater,
  draftFromRecord,
  draftFromRepeatSeed,
  draftGearFrom,
  EMPTY_DRAFT,
  logCatch,
  resolveMark,
  startPositionRequest,
  updateCatchFromDraft,
  type CatchDraft,
  type PositionRequest,
} from "../create";
import { formatClock, formatDayHeading, type UnitSystem } from "../format";
import {
  currentZone,
  logActions,
  openTripOf,
  searchable,
  useLog,
  type LogSnapshot,
} from "../store";
import {
  CHIP_CLASS,
  CHIP_OFF_ON_SURFACE,
  CHIP_ON,
  INPUT_CLASS,
  PRIMARY_BUTTON,
} from "../ui-classes";
import { CatchCard } from "./catch-card";
import { CatchDetailSheet } from "./catch-detail-sheet";
import { QuickLogSheet, type LogRequest } from "./quick-log-sheet";

/**
 * The Fish Log home (spec §8): log a catch, and review what you have caught.
 *
 * Deliberately not a dashboard. Analytics belong in their own feature (spec §8, §33) and
 * putting a catch-rate tile here would make the screen slower to use for the thing it
 * exists to do.
 *
 * The list pages at 50 rather than rendering everything: a power user reaches 10,000
 * catches (spec §41) and an unpaged list of that size janks on the phone this app is
 * for. Filtering runs over the whole set; only rendering is bounded.
 */

const PAGE_SIZE = 50;

const VIEWS: readonly { id: LogView; label: string }[] = [
  { id: "all", label: "All" },
  { id: "favorites", label: "Favorites" },
  { id: "needs_details", label: "Needs details" },
];

export function FishLog({ unitSystem }: { unitSystem: UnitSystem }) {
  const state = useLog();
  const [filters, setFilters] = useState<CatchFilters>(NO_FILTERS);
  // Paging resets whenever the filters change. Keyed on a signature of the filters and
  // derived during render rather than reset in an effect: an effect would paint one frame
  // of the old page count against the new results.
  const [paging, setPaging] = useState({ key: "", count: PAGE_SIZE });
  const searchParams = useSearchParams();
  const [logRequest, setLogRequest] = useState<LogRequest | null>(() => {
    // Calendar → day → "+ Add catch for this day" lands here (founder Historical spec §1).
    // SSR and first client render get the same answer from the URL, so this is safe.
    const add = searchParams.get("add");
    if (add && /^\d{4}-\d{2}-\d{2}$/.test(add)) {
      return {
        key: `backfill-${add}`,
        seed: null,
        note: "Logging for this day — set the time if you know it.",
        title: "Log a past catch",
        backfillDateKey: add,
      };
    }
    return null;
  });
  const [openCatchId, setOpenCatchId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);

  // The GPS is asked as soon as the sheet opens, and its answer is *read* at save time,
  // never awaited (see `startPositionRequest`). A fix that arrives after the save is
  // patched on afterwards. A ref, not state: it must not cause a render.
  const positionRequest = useRef<PositionRequest | null>(null);

  const filterKey = JSON.stringify(filters);
  const visible = paging.key === filterKey ? paging.count : PAGE_SIZE;

  const items = useMemo(() => searchable(state), [state]);
  const filtered = useMemo(() => filterCatches(items, filters), [items, filters]);
  const days = useMemo(() => groupByLocalDate(filtered), [filtered]);

  const shown = useMemo(() => {
    const out: { date: string; items: SearchableCatch[] }[] = [];
    let budget = visible;
    for (const day of days) {
      if (budget <= 0) break;
      const take = day.items.slice(0, budget);
      out.push({ date: day.date, items: take });
      budget -= take.length;
    }
    return out;
  }, [days, visible]);

  const remaining = filtered.length - shown.reduce((n, d) => n + d.items.length, 0);
  const today = useMemo(() => todayLocalDate(), []);
  // Today's Setup, offered when logging. An angler who has never opened Setup gets an
  // empty list here and the sheet simply does not show those rows (spec §14).
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
  const recentSpeciesIds = useMemo(() => recentSpecies(state), [state]);
  const openItem = items.find((i) => i.record.id === openCatchId) ?? null;

  const openFreshLog = () => {
    positionRequest.current = startPositionRequest();
    setLogRequest({ key: `fresh-${Date.now()}`, seed: null, note: null, title: "Log a catch" });
  };

  const openEdit = (item: SearchableCatch) => {
    // Editing never re-fixes the position: a fix is the record's history, not the edit's
    // (Historical spec §3). No position request is started here on purpose.
    setOpenCatchId(null);
    setLogRequest({
      key: `edit-${item.record.id}`,
      seed: draftFromRecord(
          item.record,
          state.gear,
          (() => {
            const s = state.snapshots.find(
              (snap) => snap.catch_id === item.record.id && snap.deleted_at === null,
            );
            return s
              ? {
                  waterTempC: s.water_temp_c,
                  pressureHpa: s.pressure_hpa,
                  windSpeedMs: s.wind_speed_ms,
                  windDirDeg: s.wind_dir_deg,
                }
              : null;
          })(),
        ),
      note: "Editing rewrites this catch in place. Its id, its trip, and its moment are kept.",
      title: "Edit catch",
      editId: item.record.id,
    });
  };

  const save = async (draft: CatchDraft, andAnother: boolean) => {
    const request = positionRequest.current;
    const resolving = logRequest?.resolveId;
    const editing = logRequest?.editId;

    if (editing) {
      const existing = state.catches.find((c) => c.id === editing);
      if (existing) {
        await updateCatchFromDraft(state, existing, draft);
        setJustSaved(editing);
        setLogRequest(null);
        return;
      }
    }

    // Finishing a mark updates that row; it never writes a second one.
    const result = resolving
      ? await resolveMark(state, resolving, draft)
      : // Read, do not await: whatever the GPS has managed so far is what this catch gets.
        await logCatch(state, draft, request?.value ?? null);

    setJustSaved(result.catchId);
    if (!resolving && request && !request.settled) {
      void attachPositionLater(result.catchId, request);
    }
    if (andAnother) {
      // Repeat mode (spec §6): same rig, same species, new id and new timestamp. The
      // seed comes from the draft that was just saved, so nothing is re-typed.
      positionRequest.current = startPositionRequest();
      setLogRequest({
        key: `another-${result.catchId}`,
        seed: { ...draft, weightG: null, lengthMm: null, notes: null },
        note: "Same setup as the last one. Time is new.",
        title: "Log another",
      });
    } else {
      setLogRequest(null);
    }
  };

  if (!state.hydrated) {
    return (
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Fish Log</h1>
        <p className="mt-3 text-body text-text-muted">Opening your log…</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-h1">Fish Log</h1>
          <p className="text-caption text-text-muted">
            {filtered.length} {filtered.length === 1 ? "catch" : "catches"}
          </p>
        </div>

        {!state.available ? (
          <p role="alert" className="text-caption text-error-red">
            This browser will not let the app store anything on the device, so catches
            cannot be saved. Turn off private browsing or allow site data, then reload.
          </p>
        ) : null}

        <button type="button" onClick={openFreshLog} className={PRIMARY_BUTTON}>
          + Log catch
        </button>

        {justSaved ? (
          <p role="status" className="text-caption text-text-muted">
            Saved to this device.{" "}
            {state.backup.kind === "waiting"
              ? `${state.backup.count} waiting to back up.`
              : "Backing up when you have signal."}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4">
        <label className="flex flex-col gap-2">
          <span className="text-label text-text-muted">Search your log</span>
          <input
            type="search"
            value={filters.query}
            onChange={(event) => setFilters((f) => ({ ...f, query: event.target.value }))}
            placeholder="bluefin, streaker, night bite…"
            className={INPUT_CLASS}
            autoComplete="off"
          />
        </label>

        <ul className="flex flex-wrap gap-2">
          {VIEWS.map((view) => (
            <li key={view.id}>
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, view: view.id }))}
                aria-pressed={filters.view === view.id}
                className={`${CHIP_CLASS} ${filters.view === view.id ? CHIP_ON : CHIP_OFF_ON_SURFACE}`}
              >
                {view.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {filtered.length === 0 ? (
        <EmptyState hasAny={items.length > 0} />
      ) : (
        <div className="flex flex-col gap-4">
          {shown.map((day) => (
            <section key={day.date} className="flex flex-col gap-2">
              <h2 className="text-label text-text-muted">
                {formatDayHeading(day.date, today)}
              </h2>
              <ul className="flex flex-col gap-2">
                {day.items.map((item) => (
                  <li key={item.record.id}>
                    <CatchCard
                      item={item}
                      unitSystem={unitSystem}
                      spotName={item.spotName}
                      onOpen={() => setOpenCatchId(item.record.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {remaining > 0 ? (
            <button
              type="button"
              onClick={() => setPaging({ key: filterKey, count: visible + PAGE_SIZE })}
              className={`${CHIP_CLASS} ${CHIP_OFF_ON_SURFACE} self-center`}
            >
              Show more ({remaining} left)
            </button>
          ) : null}
        </div>
      )}

      <QuickLogSheet
        request={logRequest}
        recentSpeciesIds={recentSpeciesIds}
        rods={rods}
        locations={locations}
        unitSystem={unitSystem}
        onClose={() => setLogRequest(null)}
        onSave={save}
      />

      <CatchDetailSheet
        item={openItem}
        unitSystem={unitSystem}
        spotName={openItem?.spotName ?? null}
        onClose={() => setOpenCatchId(null)}
        onDelete={async (id) => {
          await logActions.deleteCatch(id);
          setOpenCatchId(null);
        }}
        onToggleFavorite={(id) => void logActions.toggleFavorite(id)}
        onEdit={(item) => openEdit(item)}
        onDuplicate={(item) => {
          const seed = repeatSeedFrom(item.record, item.gear);
          setOpenCatchId(null);
          positionRequest.current = startPositionRequest();
          setLogRequest({
            key: `duplicate-${item.record.id}-${Date.now()}`,
            seed: draftFromRepeatSeed(seed),
            note: "Copied from an earlier catch. It saves as a new one, with a new time.",
            title: "Duplicate catch",
          });
        }}
        onResolve={(item) => {
          setOpenCatchId(null);
          positionRequest.current = startPositionRequest();
          setLogRequest({
            key: `resolve-${item.record.id}`,
            resolveId: item.record.id,
            seed: {
              ...EMPTY_DRAFT,
              gear: draftGearFrom(item.gear),
              rodSetupId: item.record.rig_id,
              locationId: item.record.location_condition_id,
            },
            note: `Saved at ${formatClock(item.record.caught_at, item.record.caught_tz)}. That time, and anything else already captured, is kept.`,
            title: "What was it?",
          });
        }}
      />
    </div>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <p className="text-body text-text-muted">
        {hasAny
          ? "No catch matches that. Clear the search or pick a different view."
          : "Nothing logged yet. Tap “Log catch” when you land one — species is the only thing you have to pick."}
      </p>
    </section>
  );
}

/** Species the angler has logged lately, most recent first. Drives the picker's top row. */
function recentSpecies(state: LogSnapshot): readonly string[] {
  const seen: string[] = [];
  for (const record of [...state.catches].sort((a, b) => (a.caught_at < b.caught_at ? 1 : -1))) {
    if (record.species_id && !seen.includes(record.species_id)) seen.push(record.species_id);
    if (seen.length >= 8) break;
  }
  return seen;
}

function todayLocalDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: currentZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
