import type { ReactNode } from "react";

import type { CategoryId } from "../types";

/**
 * One 24px stroke icon per category, drawn on the same grid with the same stroke —
 * icons always sit next to the category's text label, so they decorate and anchor
 * the grid but never carry meaning alone.
 */
export const TACKLE_CATEGORY_ICON_PATHS: Record<CategoryId, ReactNode> = {
  hooks: (
    <>
      <circle cx="15" cy="4.6" r="1.6" />
      <path d="M15 6.2v5.3a5 5 0 1 1-10 0V10" />
      <path d="M5.8 10.4 2.8 8.4" />
    </>
  ),
  jigs: (
    <>
      <circle cx="12" cy="3.6" r="1.5" />
      <path d="m12 5.5 4.5 6.2-4.5 8.8-4.5-8.8z" />
      <path d="M9.4 11.7h5.2" />
    </>
  ),
  "hard-baits": (
    <>
      <path d="M3 13c3-4 9-4 12 0-3 4-9 4-12 0z" />
      <path d="m15 13 5-3v6z" />
      <circle cx="6.6" cy="12.2" r="0.9" />
      <path d="M10 16.5v2.5a1.5 1.5 0 0 0 3 0" />
    </>
  ),
  "soft-plastics": (
    <>
      <path d="M3 15.5c2.5-6 4.5 2.5 7-2.5s4.5 2.5 7-2.5 3.5 1.5 4.5-.5" />
      <path d="M4.5 18.5c2 0 4-1 5-2" />
    </>
  ),
  line: (
    <>
      <circle cx="10" cy="12" r="6.5" />
      <circle cx="10" cy="12" r="2" />
      <path d="M16.4 9.5H21" />
      <path d="M16.4 14.5H21" />
    </>
  ),
  leaders: (
    <>
      <path d="m4 19 8-7 8-7" />
      <circle cx="4" cy="19" r="1.6" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="20" cy="5" r="1.6" />
    </>
  ),
  "sinkers-weights": (
    <>
      <circle cx="12" cy="3.8" r="1.5" />
      <path d="M12 5.3c3 3.6 4.5 6.2 4.5 8.9a4.5 4.5 0 1 1-9 0c0-2.7 1.5-5.3 4.5-8.9" />
    </>
  ),
  "terminal-tackle": (
    <>
      <circle cx="7.5" cy="7.5" r="2.8" />
      <circle cx="16.5" cy="16.5" r="2.8" />
      <path d="m9.7 9.7 4.6 4.6" />
    </>
  ),
  rods: (
    <>
      <path d="M4.5 19.5 19 5" />
      <circle cx="9.4" cy="14.8" r="2.2" />
      <path d="m6.8 19.2 1.6-1.6" />
    </>
  ),
  reels: (
    <>
      <circle cx="10.5" cy="13.5" r="6" />
      <circle cx="10.5" cy="13.5" r="1.8" />
      <path d="m15.2 9.3 3.9-3.9" />
      <circle cx="20.2" cy="4.4" r="1.4" />
    </>
  ),
  tools: (
    <>
      <path d="m7 3.5 5 6.2 5-6.2" />
      <path d="m12 9.7-4.5 10.5M12 9.7l4.5 10.5" />
    </>
  ),
  accessories: (
    <>
      <rect x="3.5" y="8" width="17" height="12" rx="2" />
      <path d="M3.5 12h17" />
      <path d="M9 8V6.5A2.5 2.5 0 0 1 11.5 4h1A2.5 2.5 0 0 1 15 6.5V8" />
    </>
  ),
  other: (
    <>
      <circle cx="6" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18" cy="12" r="1.4" />
    </>
  ),
};

export function CategoryIcon({ id, className = "h-6 w-6" }: { id: CategoryId; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {TACKLE_CATEGORY_ICON_PATHS[id]}
    </svg>
  );
}
