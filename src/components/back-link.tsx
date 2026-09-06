import Link from "next/link";

/**
 * "Go back up one level." One component, so every screen in the app says it the same way.
 *
 * It lives in `src/components/` rather than a feature because it knows no domain nouns —
 * the caller supplies where and what to call it, and ADR 005 §3's test is about vocabulary,
 * not about who happens to use a thing.
 *
 * Before this existed there were five spellings of the same idea: "← Passport",
 * "‹ Calendar", "Back to the Fish Log", a chevron SVG with a word, and — on eight screens
 * — nothing at all. Every one of them was a reasonable local choice; together they taught
 * an angler that back is a different gesture on every page, which is exactly the
 * confusion this round was opened to remove.
 *
 * The rules it settles, once:
 * - The chevron points left and is `aria-hidden`; the destination's NAME is the label, so
 *   a screen reader hears "Fish Legal, link", not "left arrow".
 * - It is a full touch target (`min-h-touch-floor`), because a back link on a boat is
 *   tapped with a wet thumb more often than anything else on the page.
 * - It sits at the very top of the page content, above the heading, always.
 */
export function BackLink({
  href,
  label,
  className = "",
}: {
  /** Where "up" is. A real parent screen, never `history.back()` — see below. */
  href: string;
  /** What that screen is called, in the words the app uses for it elsewhere. */
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-touch-floor items-center gap-2 self-start rounded-md text-label text-text-link transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring motion-reduce:transition-none ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-space-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 6-6 6 6 6" />
      </svg>
      {label}
    </Link>
  );
}
