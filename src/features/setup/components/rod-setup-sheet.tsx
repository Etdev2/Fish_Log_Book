"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { rodSetupLabel } from "@/core/rules/catch/rules";
import type { RigRecord, SetupGear, SetupType } from "@/core/rules/catch/types";
import { useTackleSession } from "@/features/tackle/session-store";
import {
  CHIP_CLASS,
  CHIP_OFF,
  CHIP_ON,
  INPUT_CLASS,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/features/catches/ui-classes";
import { SETUP_GEAR_PLACEHOLDER, SETUP_GEAR_ROLES, SETUP_TYPES } from "../vocabulary";

/**
 * Rigging one rod (spec §6, §7).
 *
 * **Tackle Box accelerates, never gates** (spec §8). Each gear line offers what the
 * angler already owns as chips, and typing anything at all is equally valid — an angler
 * who has never opened the Tackle Box can rig every rod here without noticing it exists.
 *
 * What gets stored is the *label*, plus the tackle id when one was picked. That is the
 * same id-plus-snapshot rule the catch uses (spec §15/§10): the Tackle Box is a
 * session-only prototype today, so a reference alone would go stale on the next reload
 * and take the rod's description with it.
 */
export type RodSetupRequest = {
  key: string;
  slot: number;
  existing: RigRecord | null;
};

export function RodSetupSheet({
  request,
  onClose,
  onSave,
}: {
  request: RodSetupRequest | null;
  onClose: () => void;
  onSave: (input: {
    slot: number;
    name: string | null;
    setupType: SetupType | null;
    liveBait: boolean;
    gear: readonly SetupGear[];
    previousRevision?: number;
  }) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = request !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="rod-setup-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      className="m-auto max-h-dvh w-full max-w-reading border-0 bg-transparent p-0 text-text-primary backdrop:bg-background/80"
    >
      {request ? (
        <RodForm key={request.key} request={request} onClose={onClose} onSave={onSave} />
      ) : null}
    </dialog>
  );
}

function RodForm({
  request,
  onClose,
  onSave,
}: {
  request: RodSetupRequest;
  onClose: () => void;
  onSave: (input: {
    slot: number;
    name: string | null;
    setupType: SetupType | null;
    liveBait: boolean;
    gear: readonly SetupGear[];
    previousRevision?: number;
  }) => void;
}) {
  const existing = request.existing;
  const [name, setName] = useState(existing?.name ?? "");
  const [setupType, setSetupType] = useState<SetupType | null>(existing?.setup_type ?? null);
  const [liveBait, setLiveBait] = useState(existing?.live_bait ?? false);
  const [gear, setGear] = useState<Record<string, { label: string; tackleItemId: string | null }>>(
    () => {
      const initial: Record<string, { label: string; tackleItemId: string | null }> = {};
      for (const item of existing?.gear ?? []) {
        initial[item.role] = { label: item.label, tackleItemId: item.tackle_item_id };
      }
      return initial;
    },
  );

  const tackle = useTackleSession();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const rows: SetupGear[] = SETUP_GEAR_ROLES.filter(
      (role) => (gear[role]?.label ?? "").trim() !== "",
    ).map((role) => ({
      angler_id: existing?.angler_id ?? "",
      tackle_item_id: gear[role].tackleItemId,
      role,
      label: gear[role].label.trim(),
      detail: null,
    }));
    onSave({
      slot: request.slot,
      name: name.trim() || null,
      setupType,
      liveBait,
      gear: rows,
      previousRevision: existing?.revision,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex max-h-dvh flex-col gap-4 overflow-y-auto rounded-lg border border-hairline bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="rod-setup-title" className="text-h2">
          {existing ? `Re-rig ${rodSetupLabel(existing)}` : `Rod ${request.slot}`}
        </h2>
        <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
          Cancel
        </button>
      </div>

      {existing ? (
        <p className="text-caption text-text-muted">
          Saving this records a new version of the rod. Fish already logged on it keep the
          setup they were caught on.
        </p>
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="text-label text-text-muted">Name this setup</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="40 lb Flyline"
          className={INPUT_CLASS}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-label text-text-muted">Setup type</legend>
        <div className="flex flex-wrap gap-2">
          {SETUP_TYPES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSetupType(setupType === option.id ? null : option.id)}
              aria-pressed={setupType === option.id}
              className={`${CHIP_CLASS} ${setupType === option.id ? CHIP_ON : CHIP_OFF}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {SETUP_GEAR_ROLES.map((role) => (
        <GearLine
          key={role}
          role={role}
          value={gear[role]?.label ?? ""}
          owned={tackle.items
            .filter((item) => matchesRole(item.category, role))
            .slice(0, 8)
            .map((item) => ({ id: item.id, label: item.label }))}
          onChange={(label, tackleItemId) =>
            setGear((current) => ({ ...current, [role]: { label, tackleItemId } }))
          }
        />
      ))}

      <label className="flex min-h-touch-floor items-center gap-3">
        <input
          type="checkbox"
          checked={liveBait}
          onChange={(event) => setLiveBait(event.target.checked)}
          className="size-6 accent-signal-orange"
        />
        <span className="text-body">Fishing live bait on this rod</span>
      </label>

      <button type="submit" className={`${PRIMARY_BUTTON} mt-2`}>
        {existing ? "Save new version" : "Add rod"}
      </button>
    </form>
  );
}

/**
 * One gear line: what you own as chips, plus free text.
 *
 * The chips are a shortcut, not a list of valid answers — picking one fills the text
 * box, which stays editable. Nothing here can refuse a value.
 */
function GearLine({
  role,
  value,
  owned,
  onChange,
}: {
  role: string;
  value: string;
  owned: readonly { id: string; label: string }[];
  onChange: (label: string, tackleItemId: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2">
        <span className="text-caption text-text-muted">{ROLE_LABEL[role] ?? role}</span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value, null)}
          placeholder={SETUP_GEAR_PLACEHOLDER[role] ?? ""}
          className={INPUT_CLASS}
        />
      </label>
      {owned.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {owned.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.label, item.id)}
              className={`${CHIP_CLASS} ${value === item.label ? CHIP_ON : CHIP_OFF}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  rod: "Rod",
  reel: "Reel",
  main_line: "Main line",
  leader: "Leader",
  hook: "Hook",
  jig: "Lure / jig",
  bait: "Bait",
};

/** Which Tackle Box categories are plausible for a gear role. Generous on purpose. */
function matchesRole(category: string | null, role: string): boolean {
  switch (role) {
    case "rod":
      return category === "rods";
    case "reel":
      return category === "reels";
    case "main_line":
      return category === "line";
    case "leader":
      return category === "leaders";
    case "hook":
      return category === "hooks";
    case "jig":
      return category === "jigs" || category === "hard-baits" || category === "soft-plastics";
    default:
      return false;
  }
}
