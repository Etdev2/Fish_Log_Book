"use client";

import { useEffect, useRef, useState } from "react";

import { BottomSheet } from "@/components/bottom-sheet";

import {
  EMPTY_DRAFT,
  GEAR_CATEGORIES,
  clampQuantity,
  parseTags,
  type GearDraft,
  type GearItem,
} from "../types";

/**
 * Quick Add, and the edit form — the same form, because they collect the same thing and a
 * second one would be a second design (spec §37).
 *
 * The order is the spec's 10-second path (§9): category, name, quantity, Save. Everything
 * optional sits below a divider and behind nothing — visible, skippable, never validated.
 * The only thing that can stop a save is a missing name.
 */
export function GearEditorSheet({
  open,
  onClose,
  onSave,
  initial,
  title,
  recentBrands,
  recentSizes,
  recentColors,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: GearDraft) => void;
  initial: GearDraft;
  title: string;
  recentBrands: readonly string[];
  recentSizes: readonly string[];
  recentColors: readonly string[];
}) {
  const [draft, setDraft] = useState<GearDraft>(initial);
  const [tagText, setTagText] = useState(initial.tags.join(", "));
  const [submitted, setSubmitted] = useState(false);
  const [seededFrom, setSeededFrom] = useState(initial);
  const nameRef = useRef<HTMLInputElement>(null);

  // Re-seed whenever a new draft arrives: Quick Add opens on an empty draft, Edit and
  // Duplicate open on a filled one, and reusing stale state between them is how a duplicate
  // silently saves the previous item's fields. Done during render rather than in an effect
  // — React's own "adjusting state when a prop changes" pattern — so the form never paints
  // one frame of the previous item's values.
  if (initial !== seededFrom) {
    setSeededFrom(initial);
    setDraft(initial);
    setTagText(initial.tags.join(", "));
    setSubmitted(false);
  }

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => nameRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const set = <K extends keyof GearDraft>(key: K, value: GearDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const nameMissing = draft.name.trim() === "";

  function save() {
    setSubmitted(true);
    if (nameMissing) {
      nameRef.current?.focus();
      return;
    }
    onSave({
      ...draft,
      name: draft.name.trim(),
      brand: draft.brand?.trim() || undefined,
      size: draft.size?.trim() || undefined,
      color: draft.color?.trim() || undefined,
      weight: draft.weight?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
      tags: parseTags(tagText),
      quantity: clampQuantity(draft.quantity),
    });
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} eyebrow="Tackle box" title={title}>
      <div className="gear-form">
        <label className="gear-field">
          <span>Category</span>
          <select value={draft.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
            {GEAR_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label className="gear-field">
          <span>Name</span>
          <input
            ref={nameRef}
            value={draft.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Owner Mutu Circle Hook"
            aria-invalid={submitted && nameMissing}
            aria-describedby={submitted && nameMissing ? "gear-name-error" : undefined}
          />
          {submitted && nameMissing && (
            <span id="gear-name-error" className="gear-error">
              Give this item a name.
            </span>
          )}
        </label>

        <div className="gear-field">
          <span>Quantity</span>
          <div className="gear-stepper gear-stepper-large">
            <button
              type="button"
              aria-label="One fewer"
              disabled={draft.quantity === 0}
              onClick={() => set("quantity", clampQuantity(draft.quantity - 1))}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.quantity}
              aria-label="Quantity"
              onChange={(event) => set("quantity", clampQuantity(Number(event.target.value)))}
            />
            <button type="button" aria-label="One more" onClick={() => set("quantity", clampQuantity(draft.quantity + 1))}>
              +
            </button>
          </div>
        </div>

        <button type="button" className="gear-save" onClick={save}>
          Save
        </button>

        <p className="gear-optional-note">Everything below is optional — nothing here has to be filled in.</p>

        <Suggested label="Brand" value={draft.brand ?? ""} onChange={(value) => set("brand", value)} recent={recentBrands} placeholder="Owner" />
        <Suggested label="Size" value={draft.size ?? ""} onChange={(value) => set("size", value)} recent={recentSizes} placeholder="4/0" />
        <Suggested label="Colour" value={draft.color ?? ""} onChange={(value) => set("color", value)} recent={recentColors} placeholder="Sardine" />

        <label className="gear-field">
          <span>Weight</span>
          <input value={draft.weight ?? ""} onChange={(event) => set("weight", event.target.value)} placeholder="200 g" />
        </label>

        <label className="gear-field">
          <span>Tags</span>
          <input value={tagText} onChange={(event) => setTagText(event.target.value)} placeholder="Bluefin, Offshore" />
          <span className="gear-hint">Separate with commas.</span>
        </label>

        <label className="gear-field">
          <span>Notes</span>
          <textarea rows={3} value={draft.notes ?? ""} onChange={(event) => set("notes", event.target.value)} />
        </label>

        <PhotoField imageUrl={draft.imageUrl} onChange={(url) => set("imageUrl", url)} />

        <label className="gear-check">
          <input type="checkbox" checked={draft.favorite} onChange={(event) => set("favorite", event.target.checked)} />
          <span>Favourite</span>
        </label>
      </div>
    </BottomSheet>
  );
}

/**
 * A text field that offers what the angler typed last (spec §10). The suggestions are
 * buttons, not a datalist: someone entering twenty hook sizes should be able to hit "Owner"
 * with a thumb rather than open a dropdown and pick from it.
 */
function Suggested({
  label,
  value,
  onChange,
  recent,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  recent: readonly string[];
  placeholder: string;
}) {
  return (
    <div className="gear-field">
      <label>
        <span>{label}</span>
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </label>
      {recent.length > 0 && (
        <div className="gear-recent" role="group" aria-label={`Recently used ${label.toLowerCase()}`}>
          {recent.map((option) => (
            <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)}>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A photo is optional and stays in this session (spec §19). The file never leaves the
 * device — `createObjectURL` is a handle to the browser's own copy — and the sheet says so,
 * because an image that quietly disappears on reload is worse than one that was never
 * promised.
 */
function PhotoField({ imageUrl, onChange }: { imageUrl?: string; onChange: (url: string | undefined) => void }) {
  return (
    <div className="gear-field">
      <span>Photo</span>
      <div className="gear-photo-row">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a session-only object URL
          <img className="gear-photo-preview" src={imageUrl} alt="" />
        ) : (
          <span className="gear-photo-preview gear-photo-empty" aria-hidden="true">
            📷
          </span>
        )}
        <label className="gear-photo-pick">
          <span>{imageUrl ? "Replace" : "Add photo"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onChange(URL.createObjectURL(file));
            }}
          />
        </label>
        {imageUrl && (
          <button type="button" className="gear-photo-clear" onClick={() => onChange(undefined)}>
            Remove
          </button>
        )}
      </div>
      <span className="gear-hint">Kept in this session only — photos do not sync yet.</span>
    </div>
  );
}

export function draftOf(item: GearItem | null): GearDraft {
  return item ? { ...item, tags: [...item.tags] } : EMPTY_DRAFT;
}
