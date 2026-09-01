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
 * Five destinations is the ceiling, and this is the fifth. Ordered by how the day runs
 * rather than alphabetically: you plan on the Calendar, rig on Setup, log what you catch,
 * check the Tide, and visit Settings rarely. Setup sits beside Log because the two are
 * used together — configure once, log repeatedly.
 *
 * At 320px five labels only fit because they are short. "Settings" is the longest and it
 * is the one that could be truncated to an icon first if a sixth ever arrives; adding a
 * sixth is a conversation, not a patch.
 */
export const SHELL_ROUTES = [
  { href: "/", label: "Calendar" },
  { href: "/setup", label: "Setup" },
  { href: "/log", label: "Log" },
  { href: "/tides", label: "Tide" },
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
