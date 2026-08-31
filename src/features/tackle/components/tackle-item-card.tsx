import type { TackleItem } from "../types";

export function TackleItemCard({
  item,
  compact = false,
  onToggleFavorite,
}: {
  item: TackleItem;
  compact?: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const metadata = [item.color, item.sizeLabel].filter(Boolean).join(" · ");

  return (
    <article
      className={`flex border border-hairline bg-surface ${
        compact ? "min-w-64 flex-col gap-3 rounded-lg p-4" : "items-start gap-3 rounded-lg p-4"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-h3">{item.label}</p>
        <p className="mt-1 text-caption text-text-link">{item.lureClass}</p>
        {metadata ? <p className="mt-2 text-caption text-text-muted">{metadata}</p> : null}
      </div>
      <button
        type="button"
        aria-pressed={item.isFavorite}
        onClick={() => onToggleFavorite(item.id)}
        className={`inline-flex min-h-touch-floor shrink-0 items-center justify-center rounded-full border px-4 text-label transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none ${
          item.isFavorite
            ? "border-signal-orange bg-signal-orange text-ink-on-orange"
            : "border-border-interactive bg-surface-raised text-text-link"
        }`}
      >
        {item.isFavorite ? "Favorite" : "Save favorite"}
      </button>
    </article>
  );
}
