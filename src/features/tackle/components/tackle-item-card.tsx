import { cardSummary, categoryFor, isLowStock, isOutOfStock, type TackleItem } from "../types";
import { FOCUS_RING } from "../ui-classes";
import { QuantityStepper } from "./quantity-stepper";

function FavoritePill({ isFavorite, onToggle, fullWidth = false }: { isFavorite: boolean; onToggle: () => void; fullWidth?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      onClick={onToggle}
      className={`inline-flex min-h-touch-floor ${fullWidth ? "w-full" : "min-w-36 shrink-0"} items-center justify-center gap-2 rounded-full border px-4 text-label transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none ${
        isFavorite
          ? "border-signal-orange bg-signal-orange text-ink-on-orange"
          : "border-border-interactive bg-surface-raised text-text-link"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4 shrink-0"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      >
        <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />
      </svg>
      {isFavorite ? "Favorited" : "Favorite"}
    </button>
  );
}

function Badge({ tone, children }: { tone: "low" | "out"; children: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-caption font-bold tracking-chart-pill ${
        tone === "out" ? "border-error-red text-error-red" : "border-amber-flag text-amber-flag"
      }`}
    >
      {children}
    </span>
  );
}

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

  // The rail card is a quick-rig strip: raised surface, clamped title, controls
  // pinned to the bottom so every card in the row shares the same height and edges.
  if (compact) {
    return (
      <article className="flex h-full w-64 shrink-0 flex-col gap-2 rounded-lg border border-border-interactive bg-surface-raised p-4">
        <button
          type="button"
          onClick={() => onOpen(item.id)}
          aria-label={`Edit ${item.label}`}
          className={`flex min-h-touch-floor flex-col items-start gap-1 rounded-sm text-left transition-colors hover:bg-surface ${FOCUS_RING}`}
        >
          <span className="w-full text-h3 line-clamp-2">{item.label}</span>
          {summary ? <span className="text-caption text-text-muted">{summary}</span> : null}
        </button>
        <div className="mt-auto flex flex-col gap-3 pt-1">
          {out || low ? (
            <span className="flex gap-2">
              {out ? <Badge tone="out">OUT</Badge> : null}
              {low ? <Badge tone="low">LOW</Badge> : null}
            </span>
          ) : null}
          <QuantityStepper
            value={item.quantity}
            onChange={(next) => onAdjustQuantity(item.id, next)}
            ariaLabel={`Quantity for ${item.label}`}
          />
          <FavoritePill isFavorite={item.isFavorite} onToggle={() => onToggleFavorite(item.id)} fullWidth />
        </div>
      </article>
    );
  }

  // The list card is the inventory record: name → attributes → category context,
  // then one shared control row (stepper left, favorite right) under a hairline.
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4">
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
              {out ? <Badge tone="out">OUT</Badge> : null}
              {low ? <Badge tone="low">LOW</Badge> : null}
            </span>
          ) : null}
        </span>
        {summary ? <span className="text-caption font-medium text-text-primary">{summary}</span> : null}
        <span className="text-caption text-text-muted">{categoryFor(item.category).label}</span>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
        <QuantityStepper
          value={item.quantity}
          onChange={(next) => onAdjustQuantity(item.id, next)}
          ariaLabel={`Quantity for ${item.label}`}
        />
        <FavoritePill isFavorite={item.isFavorite} onToggle={() => onToggleFavorite(item.id)} />
      </div>
    </article>
  );
}
