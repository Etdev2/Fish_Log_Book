"use client";

import { useState } from "react";

import { BottomSheet, SheetRow } from "@/components/bottom-sheet";

import { categoryLabel, clampQuantity, isLowStock, type GearItem } from "../types";

/**
 * One item, everything about it, and the four things you can do to it (spec §17).
 *
 * Delete is a two-step confirm and sits apart from the rest (§18): the controls an angler
 * reaches for constantly — quantity, favourite, duplicate — must not be a thumb's width
 * from the one that loses a record.
 */
export function GearDetailSheet({
  item,
  onClose,
  onQuantityChange,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  item: GearItem | null;
  onClose: () => void;
  onQuantityChange: (quantity: number) => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  // Keyed by item rather than reset in an effect: opening a different item is a different
  // question, so "are you sure" cannot carry over from the last one.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (!item) return null;
  const confirmingDelete = confirmingId === item.id;

  const attributes: [string, string | undefined][] = [
    ["Brand", item.brand],
    ["Size", item.size],
    ["Colour", item.color],
    ["Weight", item.weight],
    ["Notes", item.notes],
  ];

  return (
    <BottomSheet open onClose={onClose} eyebrow={categoryLabel(item.categoryId)} title={item.name}>
      <div className="gear-detail-head">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a session-only object URL
          <img className="gear-detail-photo" src={item.imageUrl} alt="" />
        ) : (
          <span className="gear-detail-photo gear-photo-empty" aria-hidden="true">
            📦
          </span>
        )}
        <div className="gear-stepper gear-stepper-large">
          <button
            type="button"
            aria-label="One fewer"
            disabled={item.quantity === 0}
            onClick={() => onQuantityChange(clampQuantity(item.quantity - 1))}
          >
            −
          </button>
          <output aria-label={`${item.quantity} in stock`}>{item.quantity}</output>
          <button type="button" aria-label="One more" onClick={() => onQuantityChange(clampQuantity(item.quantity + 1))}>
            +
          </button>
        </div>
      </div>

      {isLowStock(item) && (
        <p className="gear-low-banner">
          <span aria-hidden="true">●</span> Low stock — {item.quantity} left
        </p>
      )}

      <dl className="app-sheet-rows">
        <SheetRow label="Category">{categoryLabel(item.categoryId)}</SheetRow>
        {attributes.map(([label, value]) => value && <SheetRow key={label} label={label}>{value}</SheetRow>)}
        {item.tags.length > 0 && (
          <SheetRow label="Tags">
            <span className="gear-tags">
              {item.tags.map((tag) => (
                <span key={tag} className="gear-tag">
                  {tag}
                </span>
              ))}
            </span>
          </SheetRow>
        )}
      </dl>

      <div className="gear-actions">
        <button type="button" onClick={onEdit}>
          Edit
        </button>
        <button type="button" onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" aria-pressed={item.favorite} onClick={onToggleFavorite}>
          <span aria-hidden="true">{item.favorite ? "★" : "☆"}</span> {item.favorite ? "Favourite" : "Add favourite"}
        </button>
      </div>

      <div className="gear-danger">
        {confirmingDelete ? (
          <>
            <p>Delete {item.name}? This cannot be undone in this session.</p>
            <div className="gear-danger-row">
              <button type="button" className="gear-danger-cancel" onClick={() => setConfirmingId(null)}>
                Keep it
              </button>
              <button type="button" className="gear-danger-confirm" onClick={onDelete}>
                Delete
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="gear-danger-start" onClick={() => setConfirmingId(item.id)}>
            Delete this item
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
