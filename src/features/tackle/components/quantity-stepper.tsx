"use client";

import { clampQuantity } from "../types";

const STEP_BUTTON_CLASS =
  "inline-flex min-h-touch-floor min-w-touch-floor items-center justify-center rounded-md border border-border-interactive text-h3 text-text-link transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none";

/**
 * One-hand quantity control. On cards it is tappable only; inside the editor
 * sheet (`editable`) the count itself is a numeric input so "a pack of 25"
 * does not mean 24 taps.
 */
export function QuantityStepper({
  value,
  onChange,
  editable = false,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  editable?: boolean;
  ariaLabel: string;
}) {
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        aria-label={`Decrease quantity, currently ${value}`}
        disabled={value === 0}
        onClick={() => onChange(clampQuantity(value - 1))}
        className={`${STEP_BUTTON_CLASS} disabled:opacity-disabled disabled:active:scale-100`}
      >
        −
      </button>
      {editable ? (
        <input
          value={String(value)}
          inputMode="numeric"
          autoComplete="off"
          aria-label="Quantity"
          onChange={(event) => {
            const digits = event.target.value.replace(/[^0-9]/g, "");
            onChange(clampQuantity(Number(digits === "" ? "0" : digits)));
          }}
          className="min-h-touch-floor w-20 rounded-md border border-border-interactive bg-background text-center font-mono text-body-strong text-text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
        />
      ) : (
        <output aria-live="polite" aria-label={`Quantity ${value}`} className="w-10 text-center font-mono text-body-strong text-text-primary">
          {value}
        </output>
      )}
      <button
        type="button"
        aria-label={`Increase quantity, currently ${value}`}
        onClick={() => onChange(clampQuantity(value + 1))}
        className={STEP_BUTTON_CLASS}
      >
        +
      </button>
    </div>
  );
}
