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
 */
export const SHELL_ROUTES = [
  { href: "/", label: "Calendar" },
  FIN_ID ? { href: "/fish-id", label: "Fish ID" } : { href: "/setup", label: "Setup" },
  { href: "/log", label: "Log" },
  { href: "/tides", label: "Tide" },
  { href: "/fish-legal", label: "Legal" },
] as const;

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
                  Equal grid columns give every tab the same width; `min-h-touch-floor`
                  keeps the 48px height floor (docs/design/06-accessibility-baseline.md §3)
                  and five 48px columns (240px) fit well inside 320px.
                */
                className={`flex min-h-touch-floor min-w-touch-floor items-center justify-center border-t-2 px-1 text-center text-label ${
                  active
                    ? "border-signal-orange text-text-primary"
                    : "border-transparent text-text-link"
                }`}
              >
                {route.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
