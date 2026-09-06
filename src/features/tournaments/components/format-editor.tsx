"use client";

import { useId, useMemo, useState } from "react";

import { searchSpecies, speciesById, SPECIES } from "@/core/ontology/species";
import {
  describeCategory,
  emptyCategory,
  FAMILY_COPY,
  formatMoney,
  OFFERED_FAMILIES,
  validateFormat,
  type FormatCategory,
  type TournamentFormat,
} from "@/core/tournaments/formats";
import {
  CARD,
  CARD_PADDED,
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  FOCUS_RING,
  INPUT,
  INSET,
  SECONDARY_BUTTON,
  TABULAR,
  TERTIARY_BUTTON,
} from "../ui-classes";
import { AlertIcon, PlusIcon } from "./icons";

/**
 * The screen where a host says what their tournament actually is.
 *
 * Every control here edits one `TournamentFormat` and hands it back. It holds no state of
 * its own beyond which category is open, so the wizard, and later an edit screen on a draft
 * tournament, are the same component with a different Save button.
 *
 * The shape of the editing follows Boat Games: the preset already chose sensible answers,
 * so what is on screen is a small number of things worth changing, not a form. A host who
 * picks "Heaviest fish wins" and taps straight through gets a complete, valid tournament.
 */

export function FormatEditor({
  format,
  onChange,
}: {
  format: TournamentFormat;
  onChange: (next: TournamentFormat) => void;
}) {
  const problems = validateFormat(format);
  const multi = format.categories.length > 1;

  function updateCategory(index: number, next: FormatCategory) {
    onChange({
      ...format,
      categories: format.categories.map((item, position) => (position === index ? next : item)),
    });
  }

  function addCategory() {
    const index = format.categories.length + 1;
    onChange({
      ...format,
      categories: [...format.categories, emptyCategory(`category-${index}`, `Category ${index}`)],
    });
  }

  function removeCategory(index: number) {
    onChange({
      ...format,
      categories: format.categories.filter((_, position) => position !== index),
    });
  }

  return (
    <div className="flex flex-col gap-space-4">
      {format.categories.map((item, index) => (
        <CategoryEditor
          key={item.id}
          category={item}
          currency={format.currency}
          index={index}
          removable={multi}
          onChange={(next) => updateCategory(index, next)}
          onRemove={() => removeCategory(index)}
        />
      ))}

      <button type="button" className={SECONDARY_BUTTON} onClick={addCategory}>
        <PlusIcon />
        Add another category
      </button>

      <p className="text-caption text-text-muted">
        A category is one thing people are competing for. Most events have one. A Bisbee&apos;s-style
        event has several, each with its own winner and its own pot.
      </p>

      {problems.length > 0 ? (
        <div className={`${INSET} flex flex-col gap-space-2`} role="alert">
          <p className="inline-flex items-center gap-space-2 text-body-strong text-amber-flag">
            <AlertIcon />
            Not quite ready
          </p>
          <ul className="flex list-disc flex-col gap-space-1 pl-space-4 text-caption text-text-muted">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CategoryEditor({
  category,
  currency,
  index,
  removable,
  onChange,
  onRemove,
}: {
  category: FormatCategory;
  currency: string;
  index: number;
  removable: boolean;
  onChange: (next: FormatCategory) => void;
  onRemove: () => void;
}) {
  const fieldId = useId();
  const [open, setOpen] = useState(index === 0);

  return (
    <section className={`${CARD} flex flex-col gap-space-3 p-space-4`}>
      <div className="flex flex-col gap-space-2">
        <label htmlFor={`${fieldId}-name`} className="text-label text-text-primary">
          What is this category called?
        </label>
        <input
          id={`${fieldId}-name`}
          value={category.name}
          maxLength={60}
          onChange={(event) => onChange({ ...category, name: event.target.value })}
          className={INPUT}
          placeholder="Biggest marlin"
        />
        <p className="text-caption text-text-muted">{describeCategory(category, currency)}</p>
      </div>

      {/*
        Everything past the name is folded away by default. A host who wants the preset's
        answers should not have to scroll past six controls to reach the next step, and a
        host who wants to change them is looking for exactly this button.
      */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={TERTIARY_BUTTON}
      >
        {open ? "Hide the details" : "Change how it is scored and paid"}
      </button>

      {open ? (
        <div className="flex flex-col gap-space-5 border-t border-hairline pt-space-4">
          <FamilyPicker category={category} onChange={onChange} />
          {category.family === "SPECIES_POINTS" ? (
            <SpeciesPointsEditor category={category} onChange={onChange} />
          ) : (
            <SpeciesPicker category={category} onChange={onChange} />
          )}
          {category.family === "BEST_N_WEIGHT" ? (
            <BestNEditor category={category} onChange={onChange} />
          ) : null}
          <PayoutEditor category={category} currency={currency} onChange={onChange} />

          {removable ? (
            <button
              type="button"
              onClick={onRemove}
              className={`${TERTIARY_BUTTON} text-error-red hover:text-error-red`}
            >
              Remove this category
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function FamilyPicker({
  category,
  onChange,
}: {
  category: FormatCategory;
  onChange: (next: FormatCategory) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-space-2">
      <legend className="text-label text-text-primary">How is it won?</legend>
      <div className="flex flex-col gap-space-2">
        {OFFERED_FAMILIES.map((family) => {
          const selected = category.family === family;
          return (
            <button
              key={family}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ ...category, family })}
              className={`${FOCUS_RING} flex min-h-touch-floor flex-col items-start gap-space-1 rounded-md border p-space-3 text-left transition-colors ${
                selected
                  ? "border-signal-orange bg-signal-orange/10"
                  : "border-border-interactive bg-surface hover:border-text-link"
              }`}
            >
              <span className={`text-label ${selected ? "text-signal-orange" : "text-text-primary"}`}>
                {FAMILY_COPY[family].name}
              </span>
              <span className="text-caption text-text-muted">{FAMILY_COPY[family].blurb}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Which fish count. Empty means all of them, which is the right default for a simple event
 * and the wrong one for "Biggest marlin", so the empty state says so out loud.
 */
function SpeciesPicker({
  category,
  onChange,
}: {
  category: FormatCategory;
  onChange: (next: FormatCategory) => void;
}) {
  const [query, setQuery] = useState("");
  const fieldId = useId();
  const results = useMemo(
    () => (query.trim().length > 0 ? searchSpecies(query).slice(0, 8) : []),
    [query],
  );

  function toggle(speciesId: string) {
    const next = category.species.includes(speciesId)
      ? category.species.filter((id) => id !== speciesId)
      : [...category.species, speciesId];
    onChange({ ...category, species: next });
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-space-2">
      <label htmlFor={`${fieldId}-species`} className="text-label text-text-primary">
        Which fish count?
      </label>

      {category.species.length === 0 ? (
        <p className="text-caption text-text-muted">Every species counts. Add one to narrow it down.</p>
      ) : (
        <ul className="flex flex-wrap gap-space-2">
          {category.species.map((speciesId) => (
            <li key={speciesId}>
              <button type="button" onClick={() => toggle(speciesId)} className={`${CHIP} ${CHIP_ON}`}>
                {speciesById(speciesId)?.commonName ?? speciesId} ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        id={`${fieldId}-species`}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className={INPUT}
        placeholder="Search a species to add"
        autoComplete="off"
      />

      {results.length > 0 ? (
        <ul className="flex flex-wrap gap-space-2">
          {results.map((species) => (
            <li key={species.id}>
              <button type="button" onClick={() => toggle(species.id)} className={`${CHIP} ${CHIP_OFF}`}>
                {species.commonName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * The Captain's Cup table: a species and what it is worth.
 *
 * Points are typed, not stepped, because a host filling in fifteen species with a stepper
 * would rightly give up. The starting table comes from the preset and is entirely theirs to
 * edit — the app has no opinion about what a calico bass is worth in their water.
 */
function SpeciesPointsEditor({
  category,
  onChange,
}: {
  category: FormatCategory;
  onChange: (next: FormatCategory) => void;
}) {
  const [query, setQuery] = useState("");
  const fieldId = useId();
  const rows = Object.entries(category.speciesPoints);
  const results = useMemo(
    () =>
      query.trim().length > 0
        ? searchSpecies(query)
            .filter((species) => !(species.id in category.speciesPoints))
            .slice(0, 8)
        : [],
    [category.speciesPoints, query],
  );

  function setPoints(speciesId: string, points: number) {
    onChange({ ...category, speciesPoints: { ...category.speciesPoints, [speciesId]: points } });
  }

  function remove(speciesId: string) {
    const next = { ...category.speciesPoints };
    delete next[speciesId];
    onChange({ ...category, speciesPoints: next });
  }

  return (
    <div className="flex flex-col gap-space-3">
      <div className="flex flex-col gap-space-1">
        <span className="text-label text-text-primary">What is each fish worth?</span>
        <span className="text-caption text-text-muted">
          A species that is not on this list scores nothing, so the list is the rules.
        </span>
      </div>

      <ul className="flex flex-col gap-space-2">
        {rows.map(([speciesId, points]) => (
          <li key={speciesId} className={`${INSET} flex items-center gap-space-3`}>
            <span className="flex-1 text-body text-text-primary">
              {speciesById(speciesId)?.commonName ?? speciesId}
            </span>
            <label className="flex items-center gap-space-2">
              <span className="sr-only">
                Points for {speciesById(speciesId)?.commonName ?? speciesId}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="999"
                value={points}
                onChange={(event) => setPoints(speciesId, Number(event.target.value) || 0)}
                className={`${INPUT} ${TABULAR} w-space-16 px-space-2 text-center`}
              />
            </label>
            <button
              type="button"
              onClick={() => remove(speciesId)}
              aria-label={`Remove ${speciesById(speciesId)?.commonName ?? speciesId}`}
              className={`${FOCUS_RING} min-h-touch-floor rounded-md px-space-2 text-caption text-text-link`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <input
        id={`${fieldId}-add-species`}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className={INPUT}
        placeholder="Add a species"
        autoComplete="off"
      />

      {results.length > 0 ? (
        <ul className="flex flex-wrap gap-space-2">
          {results.map((species) => (
            <li key={species.id}>
              <button
                type="button"
                onClick={() => {
                  setPoints(species.id, 1);
                  setQuery("");
                }}
                className={`${CHIP} ${CHIP_OFF}`}
              >
                {species.commonName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-caption text-text-muted">
        {rows.length} of {SPECIES.length} species are worth something.
      </p>
    </div>
  );
}

function BestNEditor({
  category,
  onChange,
}: {
  category: FormatCategory;
  onChange: (next: FormatCategory) => void;
}) {
  const fieldId = useId();
  return (
    <label className="flex flex-col gap-space-2">
      <span className="text-label text-text-primary">How many fish count?</span>
      <input
        id={`${fieldId}-bestn`}
        type="number"
        inputMode="numeric"
        min="1"
        max="20"
        value={category.bestN ?? 3}
        onChange={(event) => onChange({ ...category, bestN: Math.max(1, Number(event.target.value) || 1) })}
        className={`${INPUT} ${TABULAR}`}
      />
      <span className="text-caption text-text-muted">Your heaviest few add up. Anything beyond does not.</span>
    </label>
  );
}

const PAYOUT_CHOICES = [
  { model: "NONE", label: "No pot", blurb: "Bragging rights, or money settled off the app." },
  { model: "WINNER_TAKE_ALL", label: "Winner takes it", blurb: "One winner, the whole pot." },
  { model: "PLACES", label: "Down the places", blurb: "Split by percentage — 50/30/20 and the like." },
] as const;

function PayoutEditor({
  category,
  currency,
  onChange,
}: {
  category: FormatCategory;
  currency: string;
  onChange: (next: FormatCategory) => void;
}) {
  const fieldId = useId();
  const feeMajor = category.entryFeeMinor === null ? "" : String(category.entryFeeMinor / 100);

  function setSplit(index: number, value: number) {
    const split = [...category.payout.split];
    split[index] = value;
    onChange({ ...category, payout: { ...category.payout, split } });
  }

  return (
    <div className="flex flex-col gap-space-3">
      <fieldset className="flex flex-col gap-space-2">
        <legend className="text-label text-text-primary">What does it pay?</legend>
        <div className="flex flex-wrap gap-space-2">
          {PAYOUT_CHOICES.map((choice) => (
            <button
              key={choice.model}
              type="button"
              aria-pressed={category.payout.model === choice.model}
              onClick={() =>
                onChange({
                  ...category,
                  payout: {
                    model: choice.model,
                    // A host switching to places should land on a sensible split rather
                    // than an empty one they have to invent from nothing.
                    split:
                      choice.model === "PLACES" && category.payout.split.length === 0
                        ? [50, 30, 20]
                        : category.payout.split,
                  },
                })
              }
              className={`${CHIP} ${category.payout.model === choice.model ? CHIP_ON : CHIP_OFF}`}
            >
              {choice.label}
            </button>
          ))}
        </div>
        <p className="text-caption text-text-muted">
          {PAYOUT_CHOICES.find((choice) => choice.model === category.payout.model)?.blurb}
        </p>
      </fieldset>

      {category.payout.model === "PLACES" ? (
        <div className="flex flex-col gap-space-2">
          <span className="text-label text-text-primary">The split</span>
          <ul className="flex flex-col gap-space-2">
            {category.payout.split.map((share, index) => (
              <li key={index} className={`${INSET} flex items-center gap-space-3`}>
                <span className="flex-1 text-body text-text-primary">
                  {["First", "Second", "Third", "Fourth", "Fifth"][index] ?? `Place ${index + 1}`}
                </span>
                <label className="flex items-center gap-space-2">
                  <span className="sr-only">Percentage for place {index + 1}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="0.1"
                    value={share}
                    onChange={(event) => setSplit(index, Number(event.target.value) || 0)}
                    className={`${INPUT} ${TABULAR} w-space-16 px-space-2 text-center`}
                  />
                </label>
                <span className="text-caption text-text-muted">%</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-space-2">
            <button
              type="button"
              className={SECONDARY_BUTTON}
              onClick={() =>
                onChange({
                  ...category,
                  payout: { ...category.payout, split: [...category.payout.split, 10] },
                })
              }
            >
              Add a place
            </button>
            {category.payout.split.length > 1 ? (
              <button
                type="button"
                className={SECONDARY_BUTTON}
                onClick={() =>
                  onChange({
                    ...category,
                    payout: { ...category.payout, split: category.payout.split.slice(0, -1) },
                  })
                }
              >
                One fewer
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <label className="flex flex-col gap-space-2">
        <span className="text-label text-text-primary">Entry fee for this category</span>
        <input
          id={`${fieldId}-fee`}
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={feeMajor}
          onChange={(event) => {
            const value = event.target.value.trim();
            onChange({
              ...category,
              entryFeeMinor: value === "" ? null : Math.max(0, Math.round(Number(value) * 100)),
            });
          }}
          className={`${INPUT} ${TABULAR}`}
          placeholder="0"
        />
        <span className="text-caption text-text-muted">
          {category.entryFeeMinor === null || category.entryFeeMinor === 0
            ? "Free to enter."
            : `${formatMoney(category.entryFeeMinor, currency)} per entry.`}{" "}
          This is what you tell entrants it costs. The app is not taking payments yet, so nothing is
          collected here.
        </span>
      </label>
    </div>
  );
}

/** A read-only summary, for the review step and the rules page. */
export function FormatSummary({ format }: { format: TournamentFormat }) {
  return (
    <ul className="flex flex-col gap-space-3">
      {format.categories.map((item) => (
        <li key={item.id} className={`${CARD_PADDED} flex flex-col gap-space-1`}>
          <span className="text-body-strong text-text-primary">{item.name}</span>
          <span className="text-caption text-text-muted">{describeCategory(item, format.currency)}</span>
          {item.family === "SPECIES_POINTS" ? (
            <span className="text-caption text-text-muted">
              {Object.entries(item.speciesPoints)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([id, points]) => `${speciesById(id)?.commonName ?? id} ${points}`)
                .join(" · ")}
              {Object.keys(item.speciesPoints).length > 6 ? " …" : ""}
            </span>
          ) : null}
          {item.species.length > 0 && item.family !== "SPECIES_POINTS" ? (
            <span className="text-caption text-text-muted">
              {item.species.map((id) => speciesById(id)?.commonName ?? id).join(", ")}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
