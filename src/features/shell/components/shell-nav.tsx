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
 */
export const SHELL_ROUTES = [
  { href: "/", label: "Calendar" },
  { href: "/learn", label: "Learn & Build" },
  { href: "/settings", label: "Settings" },
] as const;

export function ShellNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 border-t border-hairline bg-surface"
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
                className={`flex min-h-touch-floor items-center justify-center border-t-2 text-label ${
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
