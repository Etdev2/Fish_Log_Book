"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
 * Ordered by how the day runs: plan on the Calendar, rig on Setup, log what you catch,
 * check the Tide, check the Rules, visit Settings rarely.
 */
export const SHELL_ROUTES = [
  { href: "/", label: "Calendar" },
  { href: "/setup", label: "Setup" },
  { href: "/log", label: "Log" },
  { href: "/tides", label: "Tide" },
  { href: "/fish-legal", label: "Legal" },
  { href: "/settings", label: "Settings" },
] as const;

export function ShellNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="border-t border-hairline bg-surface"
    >
      <ul className="mx-auto flex max-w-3xl flex-wrap">
        {SHELL_ROUTES.map((route) => {
          const active =
            route.href === "/" ? pathname === "/" : pathname.startsWith(route.href);
          return (
            <li key={route.href} className="basis-1/3 nav-single-row:flex-1 nav-single-row:basis-auto">
              <Link
                href={route.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-touch-floor items-center justify-center border-t-2 px-1 text-center text-label ${
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
