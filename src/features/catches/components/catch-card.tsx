"use client";

import type { SearchableCatch } from "@/core/rules/catch/search";
import { sortGear } from "@/core/rules/catch/rules";
import { formatClock, summaryLine, type UnitSystem } from "../format";
import { CARD_CLASS, FOCUS_RING } from "../ui-classes";

/**
 * One catch, scannable at arm's length (spec §9).
 *
 * Deliberately partial: species, size, time, what it ate, where. Everything else waits
 * for the detail screen. A card that shows every stored field is a card nobody reads.
 *
 * The whole card is one button rather than a link so the target is the full card at any
 * width — a 70-year-old in sunlight is not aiming at a text link.
 */
export function CatchCard({
  item,
  unitSystem,
  spotName,
  onOpen,
}: {
  item: SearchableCatch;
  unitSystem: UnitSystem;
  spotName: string | null;
  onOpen: () => void;
}) {
  const { record } = item;
  const summary = summaryLine(record, unitSystem);
  const lure = sortGear(item.gear).find((g) => g.role === "jig" || g.role === "lure" || g.role === "bait");
  const unresolved = record.resolution_state === "unresolved";
  const name = item.speciesName ?? (unresolved ? "Unresolved mark" : "No species");

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${CARD_CLASS} ${FOCUS_RING} flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-surface-raised active:scale-[0.99] motion-reduce:transition-none`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-h3">{name}</h3>
        <span className="shrink-0 text-caption text-text-muted">
          {formatClock(record.caught_at, record.caught_tz)}
        </span>
      </div>

      {summary.length > 0 ? (
        <p className="text-body text-text-primary">{summary.join(" · ")}</p>
      ) : null}

      {lure ? <p className="text-caption text-text-muted">{lure.label}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        {spotName ? <span className="text-caption text-text-muted">{spotName}</span> : null}
        {record.favorite ? (
          <span className="text-caption text-text-muted">★ Favorite</span>
        ) : null}
        {unresolved ? (
          <span className="rounded-full border border-amber-flag px-3 text-caption text-amber-flag">
            Needs details
          </span>
        ) : null}
        {record.disposition === "released" ? (
          <span className="text-caption text-text-muted">Released</span>
        ) : null}
      </div>
    </button>
  );
}
