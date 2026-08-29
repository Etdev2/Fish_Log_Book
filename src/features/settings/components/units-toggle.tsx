"use client";

import { useUnitPreference } from "../units";

/**
 * Feet/metres control for /settings. Founder decision: feet is the default; this only
 * lets the angler switch it. Two large buttons rather than a select — a select is a
 * fiddly target with cold, wet hands, and this is the whole control surface, so it can
 * afford the room.
 */
export function UnitsToggle() {
  const [unit, setUnit] = useUnitPreference();

  return (
    <div role="group" aria-label="Height units">
      <div className="flex flex-wrap gap-3">
        <UnitButton label="Feet" hint="ft, ft/hr" selected={unit === "ft"} onSelect={() => setUnit("ft")} />
        <UnitButton label="Metres" hint="m, m/hr" selected={unit === "m"} onSelect={() => setUnit("m")} />
      </div>
    </div>
  );
}

function UnitButton({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`min-h-touch-floor min-w-touch-floor rounded-lg border px-5 text-left text-body font-semibold transition-colors ${
        selected
          ? "border-signal-orange bg-signal-orange text-ink-on-orange"
          : "border-border-interactive bg-surface-raised text-text-primary hover:border-tide-cyan"
      }`}
    >
      {label}
      <span className={`block text-caption font-normal ${selected ? "text-ink-on-orange" : "text-text-muted"}`}>
        {hint}
      </span>
    </button>
  );
}
