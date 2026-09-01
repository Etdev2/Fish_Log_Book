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
 * Six destinations now, by founder decision (regulations spec §16, 2026-09-01): "Rules"
 * earns the spot between Tide and Settings because a-law question beats a settings visit
 * when a fish flops in the well. The old ceiling ("five, and the fifth is the talk")
 * lived in this comment block and in shell-nav.test.ts; both were updated together —
 * the guard below is a decision record, not a patch over.
 *
 * "Rules" is deliberately the shortest label: six one-word labels still clear 320px
 * with min-h-touch-floor taps, which keeps the spec's "must not crowd the bar" clause.
 * Ordered by how the day runs: plan on the Calendar, rig on Setup, log what you catch,
 * check the Tide, check the Rules, visit Settings rarely.
 */
export const SHELL_ROUTES = [
  { href: "/", label: "Calendar" },
  { href: "/setup", label: "Setup" },
  { href: "/log", label: "Log" },
  { href: "/tides", label: "Tide" },
  { href: "/regulations", label: "Rules" },
  { href: "/settings", label: "Settings" },
] as const;

export function ShellNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="border-t border-hairline bg-surface"
    >
      <ul className="mx-auto flex max-w-3xl">
        {SHELL_ROUTES.map((route) => {
          const active =
            route.href === "/" ? pathname === "/" : pathname.startsWith(route.href);
          return (
            <li key={route.href} className="flex-1">
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
