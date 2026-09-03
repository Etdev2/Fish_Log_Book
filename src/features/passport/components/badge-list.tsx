"use client";

import Link from "next/link";

import { BADGES } from "@/core/rules/achievements/catalog";

import { usePassport } from "../data";
import { CARD_CLASS, SECONDARY_BUTTON } from "../ui-classes";

/**
 * Badges and progress (spec §12–§13).
 *
 * Earned state is carried by a word and a border, never by colour alone (spec §33), and
 * progress is stated as a plain fraction rather than a bar an angler has to interpret at
 * arm's length on a moving boat.
 */
export function BadgeList() {
  const { hydrated, badges } = usePassport();
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="flex flex-col gap-4">
      <nav>
        <Link
          href="/passport"
          className="inline-flex min-h-touch-floor items-center text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
        >
          ← Passport
        </Link>
      </nav>

      <section className={`${CARD_CLASS} p-4`}>
        <h1 className="text-h1">Badges</h1>
        <p className="mt-1 text-body text-text-muted" aria-live="polite">
          {hydrated ? `${earned} of ${badges.length} earned.` : "Reading your log…"}
        </p>
      </section>

      <ul className="flex flex-col gap-3">
        {badges.map((standing) => {
          const definition = BADGES.find((b) => b.id === standing.badgeId);
          if (definition === undefined) return null;

          return (
            <li
              key={standing.badgeId}
              className={`rounded-lg border p-4 ${
                standing.earned
                  ? "border-signal-orange bg-surface"
                  : "border-dashed border-border-interactive bg-background"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-body-strong text-text-primary">{definition.name}</h2>
                <span className="text-caption text-text-muted">
                  {standing.earned ? "Earned" : `${standing.current} of ${standing.threshold}`}
                </span>
              </div>
              <p className="mt-1 text-body text-text-muted">{definition.description}</p>
              {standing.earned && standing.awardedAt !== null ? (
                <p className="mt-1 text-caption text-text-muted">
                  Earned {standing.awardedAt.slice(0, 10)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="text-caption text-text-muted">
        There are no streaks here, and there will not be. Weather decides whether you fish this
        week; a badge should not.
      </p>

      <Link href="/passport/species" className={SECONDARY_BUTTON}>
        My Species
      </Link>
    </div>
  );
}
