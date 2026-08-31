"use client";

import { categoryFor, isLowStock, type GearItem } from "../types";

/**
 * One row in the inventory. Deliberately not every attribute (spec §7): name, then the
 * two or three things that tell one hook from the next, then quantity. Everything else is
 * one tap away in the detail sheet.
 *
 * `content-visibility: auto` in the stylesheet means a row scrolled far off screen costs
 * no layout or paint, which is most of how this stays usable at 5,000 entries (§22).
 *
 * Favourite is an INDICATOR here, not a control. A star button beside the stepper cost
 * 48px of a 390px row, which is what was truncating "Owner Mutu Light Circle 4/0" to
 * "Mutu Light…" — the name is the thing the row exists to show. Toggling it lives one tap
 * away in the detail sheet, where it has room.
 */
export function GearCard({
  item,
  onOpen,
  onQuantityChange,
}: {
  item: GearItem;
  onOpen: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  const category = categoryFor(item.categoryId);
  const attributes = [item.brand, item.size, item.color].filter(Boolean).join(" · ");

  return (
    <li className="gear-row">
      <button type="button" className="gear-row-open" onClick={onOpen} aria-haspopup="dialog">
        <span className="gear-thumb" aria-hidden="true">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a session-only object URL
            <img src={item.imageUrl} alt="" />
          ) : (
            <span>{category?.glyph ?? "📦"}</span>
          )}
        </span>
        <span className="gear-row-text">
          <span className="gear-row-name">
            {item.favorite && <span className="gear-star">★ </span>}
            {item.name}
          </span>
          <span className="gear-row-meta">
            {attributes || category?.label}
            {isLowStock(item) && <span className="gear-low">Low stock</span>}
          </span>
        </span>
      </button>

      <span className="gear-stepper">
        <button
          type="button"
          aria-label={`Remove one ${item.name}`}
          disabled={item.quantity === 0}
          onClick={() => onQuantityChange(item.quantity - 1)}
        >
          −
        </button>
        <output aria-label={`${item.quantity} in stock`}>{item.quantity}</output>
        <button type="button" aria-label={`Add one ${item.name}`} onClick={() => onQuantityChange(item.quantity + 1)}>
          +
        </button>
      </span>

    </li>
  );
}
