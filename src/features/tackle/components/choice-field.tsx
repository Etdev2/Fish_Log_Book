"use client";

import { useId, useState } from "react";

import { suggestedOptions, type AttributeField } from "../types";
import { CHIP_CLASS, CHIP_OFF, CHIP_ON } from "../ui-classes";

/**
 * The single repeated field pattern for the Add Gear sheet: a row of common
 * choices (angler's own recent values first), always ending in an "Other…"
 * chip that opens a free-text input. Nothing is ever locked to the chip list.
 */
export function ChoiceField({
  field,
  options,
  value,
  recents,
  onChange,
}: {
  field: AttributeField;
  /**
   * The options to show, already resolved by `fieldOptions` (ADR 008). This component
   * stays dumb on purpose: a field whose choices depend on another field is a domain
   * rule, and the caller owns it.
   */
  options: readonly string[];
  value: string;
  recents: readonly string[];
  onChange: (value: string) => void;
}) {
  const customInputId = useId();
  const knownOptions = suggestedOptions(options, recents, field.maxChips);
  const valueIsCustom = value !== "" && !knownOptions.some((option) => option === value);
  const [customOpen, setCustomOpen] = useState(valueIsCustom);
  const showCustomInput = customOpen || valueIsCustom;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-label">
        {field.label} <span className="font-normal text-text-muted">(optional)</span>
      </legend>
      {/*
        A dependent field before its controller is answered: no chips would leave a bare
        "Other…" and no way to know why. Say what to do instead. Other… stays available,
        because somebody who knows their reel is a 30 should not be blocked on picking a
        type first.
      */}
      {knownOptions.length === 0 && field.emptyHint ? (
        <p className="text-caption text-text-muted">{field.emptyHint}</p>
      ) : null}
      <div className="flex flex-wrap gap-3" role="group" aria-label={`${field.label} choices`}>
        {knownOptions.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onChange(selected ? "" : option);
                setCustomOpen(false);
              }}
              className={`${CHIP_CLASS} ${selected ? CHIP_ON : CHIP_OFF}`}
            >
              {option}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={showCustomInput}
          onClick={() => setCustomOpen((open) => !open)}
          className={`${CHIP_CLASS} ${showCustomInput ? CHIP_ON : CHIP_OFF}`}
        >
          Other…
        </button>
      </div>
      {showCustomInput ? (
        <>
          <label htmlFor={customInputId} className="sr-only">
            {field.label} — type your own
          </label>
          <input
            id={customInputId}
            value={valueIsCustom || customOpen ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            className="min-h-touch-floor rounded-md border border-border-interactive bg-background px-4 text-body text-text-primary placeholder:text-text-muted focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
          />
        </>
      ) : null}
    </fieldset>
  );
}
