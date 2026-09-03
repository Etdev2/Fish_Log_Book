"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SPECIES, type Species } from "@/core/ontology/species";
import { COLLECTIONS } from "@/core/rules/passport/collections";
import type { SpeciesSummary } from "@/core/rules/passport/types";

import { usePassport } from "../data";
import { CARD_CLASS, CHIP_CLASS, CHIP_OFF, CHIP_ON, SELECT_CLASS } from "../ui-classes";

/**
 * My Species (passport spec §9, Ticket 3).
 *
 * The gaps are the point. A grid that showed only what an angler has caught would be a
 * trophy cabinet; showing the fish they have *not* caught, in the families they already
 * fish, is what makes someone try a new spot. Uncaught cards are deliberately quiet —
 * a dashed outline and muted type, never a locked padlock or a nag.
 *
 * Protected species carry a label and are never presented as something to go and get
 * (spec §9, §11). They are here so an angler learns the fish exists and knows to let it go.
 *
 * Photos live on the detail page, not here. Only 51 of 178 species have a bundled image
 * and each carries an attribution line it must be shown with, so a grid of them would be
 * both patchy and non-compliant. Text at 320px is also simply faster to read.
 */

type CaughtFilter = "all" | "caught" | "uncaught";
type WaterFilter = "all" | "salt" | "fresh";
type SortKey = "recent" | "first" | "most" | "name" | "best-length";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Recently caught",
  first: "First caught",
  most: "Most caught",
  name: "Name A–Z",
  "best-length": "Personal best",
};

function millisOf(iso: string | undefined): number {
  if (iso === undefined) return -1;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? -1 : ms;
}

export function SpeciesGrid() {
  const { hydrated, summaryOf, caughtSpeciesIds } = usePassport();
  const [caught, setCaught] = useState<CaughtFilter>("all");
  const [water, setWater] = useState<WaterFilter>("all");
  const [family, setFamily] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const familyMembers = useMemo(() => {
    const map = new Map<string, ReadonlySet<string>>();
    for (const collection of COLLECTIONS) {
      map.set(collection.id, new Set(collection.species.map((s) => s.speciesId)));
    }
    return map;
  }, []);

  const rows = useMemo(() => {
    const members = family === "all" ? null : familyMembers.get(family);

    const visible = SPECIES.filter((species) => {
      // Group entries ("Rockfish") are a way to log a fish you cannot name, not a
      // collectible. Spec §10 keeps them in history and out of the collection.
      if (species.isGroup) return false;
      if (members !== null && members !== undefined && !members.has(species.id)) return false;
      if (water !== "all" && species.waterClass !== water) return false;

      const has = caughtSpeciesIds.has(species.id);
      if (caught === "caught" && !has) return false;
      if (caught === "uncaught" && has) return false;
      return true;
    });

    const withSummary = visible.map((species) => ({
      species,
      summary: summaryOf(species.id),
    }));

    const byName = (a: { species: Species }, b: { species: Species }) =>
      a.species.commonName.localeCompare(b.species.commonName);

    return withSummary.sort((a, b) => {
      // An uncaught species has nothing to sort by, so it falls to the bottom by name
      // rather than jumbling through the middle of the list.
      if (sort === "name") return byName(a, b);
      if (a.summary === null && b.summary === null) return byName(a, b);
      if (a.summary === null) return 1;
      if (b.summary === null) return -1;

      if (sort === "recent") {
        return millisOf(b.summary.latestCaughtAt) - millisOf(a.summary.latestCaughtAt) || byName(a, b);
      }
      if (sort === "first") {
        return millisOf(a.summary.firstCaughtAt) - millisOf(b.summary.firstCaughtAt) || byName(a, b);
      }
      if (sort === "most") return b.summary.catchCount - a.summary.catchCount || byName(a, b);
      return (b.summary.bestLength?.value ?? 0) - (a.summary.bestLength?.value ?? 0) || byName(a, b);
    });
  }, [caught, water, family, sort, familyMembers, caughtSpeciesIds, summaryOf]);

  const caughtCount = rows.filter((r) => r.summary !== null).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
          {(["all", "caught", "uncaught"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCaught(value)}
              aria-pressed={caught === value}
              className={`${CHIP_CLASS} ${caught === value ? CHIP_ON : CHIP_OFF}`}
            >
              {value === "all" ? "All" : value === "caught" ? "Caught" : "Not yet"}
            </button>
          ))}
        </div>

        {/*
          Two up, then sort across the bottom. Stacked, these three ate the whole first
          screen at 320px and pushed every fish below the fold — the grid is the page, not
          the controls.
        */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">Water</span>
            <select
              value={water}
              onChange={(e) => setWater(e.target.value as WaterFilter)}
              className={`${SELECT_CLASS} w-full`}
            >
              <option value="all">All water</option>
              <option value="salt">Saltwater</option>
              <option value="fresh">Freshwater</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-muted">Family</span>
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              className={`${SELECT_CLASS} w-full`}
            >
              <option value="all">All families</option>
              {COLLECTIONS.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>

          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-caption text-text-muted">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={`${SELECT_CLASS} w-full`}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="text-caption text-text-muted" aria-live="polite">
        {!hydrated
          ? "Reading your log…"
          : `${caughtCount} caught of ${rows.length} shown`}
      </p>

      {rows.length === 0 ? (
        <p className={`${CARD_CLASS} p-4 text-body text-text-muted`}>
          Nothing matches those filters. Try widening them.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rows.map(({ species, summary }) => (
            <li key={species.id}>
              <SpeciesCard species={species} summary={summary} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SpeciesCard({
  species,
  summary,
}: {
  species: Species;
  summary: SpeciesSummary | null;
}) {
  const caught = summary !== null;

  return (
    <Link
      href={`/passport/species/${species.id}`}
      className={`flex h-full min-h-touch-floor flex-col gap-1 rounded-lg border p-3 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring ${
        caught
          ? "border-hairline bg-surface hover:bg-surface-raised"
          : "border-dashed border-border-interactive bg-background hover:bg-surface"
      }`}
    >
      <span className={`text-body-strong ${caught ? "text-text-primary" : "text-text-muted"}`}>
        {species.commonName}
      </span>

      {species.scientificName !== null ? (
        <span className="text-caption italic text-text-muted">{species.scientificName}</span>
      ) : null}

      {/* Status is words as well as colour and weight — spec §33. */}
      {caught ? (
        <span className="mt-auto text-caption text-text-muted">
          {summary.catchCount === 1 ? "1 catch" : `${summary.catchCount} catches`}
          {summary.bestLength !== null ? ` · best ${Math.round(summary.bestLength.value / 10)} cm` : ""}
        </span>
      ) : (
        <span className="mt-auto text-caption text-text-muted">Not yet caught</span>
      )}

      {species.takeStatus === "protected" ? (
        <span className="text-caption text-amber-flag">Protected — release it</span>
      ) : null}
    </Link>
  );
}
