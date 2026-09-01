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
  value,
  recents,
  onChange,
}: {
  field: AttributeField;
  value: string;
  recents: readonly string[];
  onChange: (value: string) => void;
}) {
  const customInputId = useId();
  const knownOptions = suggestedOptions(field.options, recents, field.maxChips);
  const valueIsCustom = value !== "" && !knownOptions.some((option) => option === value);
  const [customOpen, setCustomOpen] = useState(valueIsCustom);
  const showCustomInput = customOpen || valueIsCustom;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-label">
        {field.label} <span className="font-normal text-text-muted">(optional)</span>
      </legend>
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
