"use client";

import { parseMeasurement } from "@/core/rules/catch/measurement";
import { CHIP_CLASS, CHIP_OFF, CHIP_ON, INPUT_CLASS } from "../ui-classes";

/**
 * A number and its unit, with the measured/estimated distinction where it belongs —
 * beside the value, at the moment of typing (spec §24).
 *
 * `inputMode="decimal"` rather than `type="number"`: a numeric keypad without the
 * scroll-wheel and spinner behaviour that makes `type=number` hostile on a phone.
 */
export function MeasurementField({
  label,
  value,
  onChange,
  units,
  unit,
  onUnitChange,
  placeholder,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  units: readonly string[];
  unit: string;
  onUnitChange: (next: string) => void;
  placeholder: string;
  invalid?: boolean;
}) {
  const parsed = parseMeasurement(value);
  const showError = invalid || parsed === undefined;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2">
        <span className="text-label text-text-muted">{label}</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? `${label}-error` : undefined}
          className={INPUT_CLASS}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {units.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onUnitChange(option)}
            aria-pressed={unit === option}
            className={`${CHIP_CLASS} ${unit === option ? CHIP_ON : CHIP_OFF}`}
          >
            {option}
          </button>
        ))}
      </div>
      {showError ? (
        <p id={`${label}-error`} role="alert" className="text-caption text-error-red">
          That is not a number. Leave it blank if you did not measure it.
        </p>
      ) : null}
    </div>
  );
}
