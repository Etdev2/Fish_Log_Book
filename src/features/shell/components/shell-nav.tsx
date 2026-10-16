"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FIN_ID } from "@/features/wildlife/flag";

/**
 * The one persistent navigation element, rendered by src/app/(app)/layout.tsx.
 *
 * It knows the words "Calendar" and "Settings", so by ADR 005 §3's domain-noun test it is a
 * feature component and cannot live in src/components/.
 *
 * Bottom-anchored for one-handed use on a moving boat. Position and appearance are ux-ui's
 * call (ADR 005 §4) — this is a working default, not a design decision defended here.
 *
 * Sticky positioning lives on the shell's bottom dock rather than here, so the nav and
 * the optional quick-mark action are pinned as one unit and cannot overlap each other.
 */
/**
 * Six destinations now, by founder decision (regulations spec §16, then the Fish Legal\n * expansion spec §2, 2026-09-02): nav label "Legal" (founder-locked, "Fish Legal" is the\n * section name on pages; at 320px the bar reads verbs, so the test pins wording). "Rules"
 * earns the spot between Tide and Settings because a-law question beats a settings visit
 * when a fish flops in the well. The old ceiling ("five, and the fifth is the talk")
 * lived in this comment block and in shell-nav.test.ts; both were updated together —
 * the guard below is a decision record, not a patch over.
 *
 * "Rules" is deliberately the shortest label. Six labels do NOT clear 320px in one row,
 * despite what this comment claimed until 2026-09-03: measured, the bar wants 366px and
 * overflowed the viewport by 46px at 320 and by 6px at 360, which is why "Settings" read
 * as "Set" on a small phone. Below `nav-single-row` (384px) the bar wraps to two rows of
 * three instead — all six labels at full size, every tap still min-h-touch-floor, nothing
 * off-screen. Wrapping flex rather than a six-column grid on purpose: equal columns would
 * need six times the *widest* label (432px) where flex needs only their sum (366px), so a
 * grid would have pushed two rows onto every phone made.
 * Shrinking the type was not an option: the 16px floor in docs/design/01-foundations.md
 * has no escape hatch, and it is the right rule.
 * Ordered by how the day runs: plan on the Calendar, identify what you caught, log it,
 * check the Tide, check the Rules, visit Settings rarely.
 *
 * UI-1 #12 (2026-10-14): the second slot was "Setup" — a one-time task already promoted
 * by the Welcome card on the calendar and listed in the Menu ("Your gear"). It is now
 * "Fish ID", the per-catch, on-the-water question ("what did I just land?") that sits
 * right before logging. Chosen over Passport because it is used during the trip, not
 * after it; because Passport already has a card on the calendar home; and because
 * "Fish ID" is two characters wider than "Setup" where "Passport" is three, and this bar
 * has almost no slack at 390px. Measured at 390px with px-1, "Fish ID" (59px label) made
 * the row 395px and pushed Settings onto a second row, so item padding is now px-0.5:
 * the row needs ~371px and fits one row from 384px again. Every item keeps
 * min-w-touch-floor, and `flex-1` hands the spare width back as spacing. Same slot, so no
 * other tab moves. If the Fish ID flag is off, Setup keeps the slot rather than leaving
 * a hole.
 *
 * UI-1 #12 follow-up (2026-10-14, founder-approved): six tabs only fit by squeezing item
 * padding to px-0.5 and still wrapped below 384px. The bar is now five equal-width tabs
 * (a 5-column grid, centered labels, normal px-1 padding) on one row at every width;
 * Settings moved out of the bar and stays reachable from the Menu ("Settings" under
 * Your gear). At 390px each tab is 78px wide x 48px tall; at 320px, 64px.
 *
 * Founder, 2026-10-16 ("a five-year-old understands it"): text-only tabs at 18px clipped
 * "Calendar" against the screen edge and gave no picture to recognise. Each tab is now an
 * icon over a 16px caption (the type floor, not below it), and the current tab is an
 * orange pill behind its icon rather than a 2px line. Icons live in TAB_ICONS, keyed by
 * href, so SHELL_ROUTES and its tests keep their exact shape.
 *
 * Same day: the first tab is "Home", not "Calendar". At 320px a 64px column cannot hold
 * "Calendar" at the 16px floor (it truncated to "Calen…"), and "Home" is the word every
 * phone app uses for the screen you start on — which this is, calendar and all.
 */
export const SHELL_ROUTES = [
  { href: "/", label: "Home" },
  FIN_ID ? { href: "/fish-id", label: "Fish ID" } : { href: "/setup", label: "Setup" },
  { href: "/log", label: "Log" },
  { href: "/tides", label: "Tide" },
  { href: "/fish-legal", label: "Legal" },
] as const;

const ICON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** One picture per tab. Drawn in currentColor so the active tab's colour carries through. */
const TAB_ICONS: Record<string, React.ReactNode> = {
  "/": (
    <>
      <path d="M3 11l9-7 9 7" {...ICON} />
      <path d="M5 10v10h14V10" {...ICON} />
      <path d="M10 20v-5h4v5" {...ICON} />
    </>
  ),
  "/fish-id": (
    <>
      <path d="M2 12c3-4 7-5 11-3l4-3v12l-4-3c-4 2-8 1-11-3z" {...ICON} />
      <circle cx="7" cy="11" r="1" fill="currentColor" />
      <path d="M20 4l2 2M22 4l-2 2" {...ICON} />
    </>
  ),
  "/setup": (
    <>
      <circle cx="12" cy="12" r="3" {...ICON} />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" {...ICON} />
    </>
  ),
  "/log": (
    <>
      <path d="M5 3h11l3 3v15H5z" {...ICON} />
      <path d="M9 9h6M9 13h6M9 17h4" {...ICON} />
    </>
  ),
  "/tides": (
    <>
      <path d="M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0" {...ICON} />
      <path d="M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0" {...ICON} />
    </>
  ),
  "/fish-legal": (
    <>
      <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" {...ICON} />
      <path d="M8.5 12l2.5 2.5 4.5-5" {...ICON} />
    </>
  ),
};

export function ShellNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="border-t border-hairline bg-surface"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {SHELL_ROUTES.map((route) => {
          const active =
            route.href === "/" ? pathname === "/" : pathname.startsWith(route.href);
          return (
            <li key={route.href} className="min-w-0">
              <Link
                href={route.href}
                aria-current={active ? "page" : undefined}
                /*
                  Equal grid columns give every tab the same width; the icon + caption stack
                  stays above the 48px floor (docs/design/06-accessibility-baseline.md §3).
                */
                className={`flex min-h-touch-floor min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 pb-1 pt-1.5 text-center text-caption font-semibold focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-focus-ring ${
                  active ? "text-signal-orange" : "text-text-link"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-8 w-14 items-center justify-center rounded-full ${
                    active ? "bg-surface-raised" : ""
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="size-6">
                    {TAB_ICONS[route.href]}
                  </svg>
                </span>
                <span className="max-w-full truncate">{route.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
