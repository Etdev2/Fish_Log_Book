"use client";

import { useMemo, useState } from "react";

import { popularSpecies, regionById } from "@/core/ontology/regions";
import { searchSpecies, speciesById, SPECIES, type Species } from "@/core/ontology/species";
import { useRegionPreference } from "@/features/settings/region";
import { CHIP_CLASS, CHIP_OFF, CHIP_ON, FOCUS_RING, INPUT_CLASS } from "../ui-classes";

/**
 * Species selection, which is the only required field on a catch and therefore the one
 * control on the critical path (spec §5).
 *
 * The ordering is the design: **recent first**, because the fish you just caught is
 * overwhelmingly the fish you are about to catch again, and a hot bite is exactly when
 * nobody can scroll. Search only appears once there are enough species on screen to
 * need it — a search box above six chips is furniture, not help.
 *
 * "Something else" is never hidden behind the search: a fish that is not in the
 * vocabulary still has to be loggable in one tap, and `species_other` is a separate
 * column precisely so it can never be confused with a real id (spec §5).
 */
export function SpeciesPicker({
  recentIds,
  selectedId,
  selectedOther,
  onSelect,
  onSelectOther,
}: {
  recentIds: readonly string[];
  selectedId: string | null;
  selectedOther: string | null;
  onSelect: (id: string) => void;
  onSelectOther: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [otherOpen, setOtherOpen] = useState(selectedOther !== null);
  const [otherText, setOtherText] = useState(selectedOther ?? "");
  // Once a species is chosen the list collapses to the answer.
  //
  // Not decoration: the full list is a dozen chips tall, which pushed Rod, Where and
  // Save below the fold and turned a four-tap flow into a scroll. Picking is still one
  // tap from a visible list; the moment it is answered the question gets out of the way.
  const [picking, setPicking] = useState(true);

  const recent = useMemo(
    () => recentIds.map((id) => speciesById(id)).filter((s): s is Species => s !== null),
    [recentIds],
  );

  const results = useMemo(() => {
    if (query.trim() === "") return [];
    return searchSpecies(query).slice(0, 20);
  }, [query]);

  // What this angler reaches for before they have any history at all.
  //
  // Driven by the Fishing region preference (ADR 007 §4): curated per region rather than
  // "the first N by sort_order", because the vocabulary is ordered by habitat and the head
  // of it would offer a SoCal surfer's list to a walleye angler. It stops mattering after
  // a handful of catches, when Recent takes over. Suggestions only — search and "Something
  // else" always reach the full vocabulary.
  const [regionId] = useRegionPreference();
  const region = regionById(regionId);

  const common = useMemo(() => {
    const recentSet = new Set(recentIds);
    return popularSpecies(regionId).filter((s) => !recentSet.has(s.id));
  }, [regionId, recentIds]);

  const rest = useMemo(() => {
    const shown = new Set([...recentIds, ...common.map((s) => s.id)]);
    return SPECIES.filter((s) => !shown.has(s.id)).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [recentIds, common]);

  const showing = query.trim() !== "" ? results : null;
  const chosen = speciesById(selectedId);

  const choose = (id: string) => {
    onSelect(id);
    setPicking(false);
  };

  if (!picking && (chosen || selectedOther)) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-label text-text-muted">Species</span>
          <span className="truncate text-h3">{chosen?.commonName ?? selectedOther}</span>
        </div>
        <button
          type="button"
          onClick={() => setPicking(true)}
          className={`${CHIP_CLASS} ${CHIP_OFF} shrink-0`}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-label text-text-muted">Search species</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          // The hint fish live in the chosen region too — a Florida angler should not
          // be invited to search for bluefin.
          placeholder={`${common
            .slice(0, 3)
            .map((s) => s.commonName.replaceAll(/\s*\(.*\)\s*/g, "").toLowerCase())
            .join(", ") || "species"}…`}
          className={INPUT_CLASS}
          autoComplete="off"
        />
      </label>

      {showing !== null ? (
        <SpeciesChips
          heading={showing.length === 0 ? "No match" : "Results"}
          species={showing}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ) : (
        <>
          {recent.length > 0 ? (
            <SpeciesChips
              heading="Recent"
              species={recent}
              selectedId={selectedId}
              onSelect={choose}
            />
          ) : null}
          <SpeciesChips
            // Naming the region is the honest label: the row genuinely changes with it.
            heading={
              regionId === "custom"
                ? "Species"
                : `Common — ${region?.label ?? ""}`
            }
            species={common}
            selectedId={selectedId}
            onSelect={choose}
          />
          {/* Everything else is one tap away, so a species that is merely uncommon never
              requires typing on a wet screen. */}
          <details className="flex flex-col gap-2">
            <summary
              className={`${CHIP_CLASS} ${CHIP_OFF} inline-flex w-fit cursor-pointer items-center`}
            >
              All species ({rest.length})
            </summary>
            <div className="pt-2">
              <SpeciesChips
                heading="Everything else"
                species={rest}
                selectedId={selectedId}
                onSelect={choose}
              />
            </div>
          </details>
        </>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setOtherOpen((open) => !open)}
          aria-expanded={otherOpen}
          className={`${CHIP_CLASS} ${selectedOther !== null ? CHIP_ON : CHIP_OFF} self-start`}
        >
          {selectedOther !== null ? `Other: ${selectedOther}` : "Something else…"}
        </button>
        {otherOpen ? (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-2">
              <span className="text-label text-text-muted">What was it?</span>
              <input
                type="text"
                value={otherText}
                onChange={(event) => setOtherText(event.target.value)}
                onBlur={() => {
                  if (otherText.trim()) {
                    onSelectOther(otherText.trim());
                    setPicking(false);
                  }
                }}
                placeholder="e.g. something long and silver"
                className={INPUT_CLASS}
              />
            </label>
            <p className="text-caption text-text-muted">
              Saved as your own words. It stays out of species statistics until it can be
              matched to a real species.
            </p>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onSelectOther("")}
        className={`text-label text-text-link underline underline-offset-4 ${FOCUS_RING} self-start`}
      >
        Don&apos;t know yet — log it without a species
      </button>
    </div>
  );
}

function SpeciesChips({
  heading,
  species,
  selectedId,
  onSelect,
}: {
  heading: string;
  species: readonly Species[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-label text-text-muted">{heading}</h3>
      {species.length === 0 ? (
        <p className="text-body text-text-muted">
          Nothing matched. Use &ldquo;Something else&rdquo; below.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {species.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-pressed={selectedId === item.id}
                className={`${CHIP_CLASS} ${selectedId === item.id ? CHIP_ON : CHIP_OFF}`}
              >
                {item.commonName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

