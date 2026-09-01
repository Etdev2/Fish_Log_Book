import { cardSummary, categoryFor, isLowStock, isOutOfStock, type TackleItem } from "../types";
import { QuantityStepper } from "./quantity-stepper";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

export function TackleItemCard({
  item,
  compact = false,
  onOpen,
  onToggleFavorite,
  onAdjustQuantity,
}: {
  item: TackleItem;
  compact?: boolean;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAdjustQuantity: (id: string, next: number) => void;
}) {
  const summary = cardSummary(item);
  const out = isOutOfStock(item);
  const low = !out && isLowStock(item);

  return (
    <article
      className={`flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4 ${
        compact ? "w-64 shrink-0" : ""
      }`}
    >
      {/* The text block is the open/edit target; it is a plain button holding
          no other interactive elements, so cards never nest buttons. */}
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-label={`Edit ${item.label}`}
        className={`flex min-h-touch-floor flex-col items-start gap-1 rounded-sm text-left transition-colors hover:bg-surface-raised ${FOCUS_RING}`}
      >
        <span className="flex w-full items-start justify-between gap-3">
          <span className="text-h3">{item.label}</span>
          {out || low ? (
            <span className="mt-1 flex shrink-0 gap-2">
              {out ? (
                <span className="rounded-full border border-error-red px-2 py-0.5 text-caption font-bold tracking-chart-pill text-error-red">
                  OUT
                </span>
              ) : null}
              {low ? (
                <span className="rounded-full border border-amber-flag px-2 py-0.5 text-caption font-bold tracking-chart-pill text-amber-flag">
                  LOW
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
        {summary ? <span className="text-caption text-text-link">{summary}</span> : null}
        <span className="text-caption text-text-muted">{categoryFor(item.category).label}</span>
      </button>

      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-3">
        <QuantityStepper
          value={item.quantity}
          onChange={(next) => onAdjustQuantity(item.id, next)}
          ariaLabel={`Quantity for ${item.label}`}
        />
        <button
          type="button"
          aria-pressed={item.isFavorite}
          onClick={() => onToggleFavorite(item.id)}
          className={`inline-flex min-h-touch-floor min-w-28 shrink-0 items-center justify-center rounded-full border px-4 text-label transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none ${
            item.isFavorite
              ? "border-signal-orange bg-signal-orange text-ink-on-orange"
              : "border-border-interactive bg-surface-raised text-text-link"
          }`}
        >
          {item.isFavorite ? "Favorited" : "Favorite"}
        </button>
      </div>
    </article>
  );
}
