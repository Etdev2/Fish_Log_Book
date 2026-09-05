"use client";

import Link from "next/link";

import { speciesById } from "@/core/ontology/species";
import type { SlamCategory } from "@/core/rules/slams/types";

import { usePassport, type SlamView } from "../data";
import { CARD_CLASS } from "../ui-classes";

/**
 * Slams — several species, one day (founder request 2026-09-03).
 *
 * Ordered by the angler's region so a Californian sees the Island Trifecta first, but
 * nothing is hidden: a SoCal angler who takes one week in the Keys should still be told
 * they got the Inshore Grand Slam. Region decides the order, the fish decide the credit.
 *
 * A near miss is shown deliberately. "Two of three on 14 June" is the line that makes
 * someone go back out, and it is honest — it is a fact about their log, not a nudge.
 */
export function SlamList() {
  const { hydrated, slams } = usePassport();
  const achieved = slams.filter((s) => s.standing.achieved).length;

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
        <h1 className="text-h1">Slams</h1>
        <p className="mt-1 text-body text-text-muted">
          Several species, one day. The day is what makes it hard — the same three fish across
          three trips is three good days, not a trifecta.
        </p>
        <p className="mt-3 text-body-strong" aria-live="polite">
          {hydrated ? `${achieved} of ${slams.length} done` : "Reading your log…"}
        </p>
      </section>

      <ul className="flex flex-col gap-3">
        {slams.map((slam) => (
          <li key={slam.definition.id}>
            <SlamCard slam={slam} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlamCard({ slam }: { slam: SlamView }) {
  const { definition, standing } = slam;
  const { categories, requiredCategories } = definition;
  const partial = categories.length > requiredCategories;

  return (
    <article
      className={`rounded-lg border p-4 ${
        standing.achieved
          ? "border-signal-orange bg-surface"
          : "border-dashed border-border-interactive bg-background"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-body-strong text-text-primary">{definition.name}</h2>
        <span className="text-caption text-text-muted">
          {standing.achieved
            ? standing.days.length === 1
              ? "Done"
              : `Done ×${standing.days.length}`
            : `0 of ${requiredCategories}`}
        </span>
      </div>

      <p className="mt-1 text-body text-text-muted">{definition.description}</p>

      <p className="mt-2 text-caption text-text-muted">
        {partial ? `Any ${requiredCategories} of:` : "All of:"}{" "}
        {categories.map((c) => categoryLabel(c)).join(" · ")}
      </p>

      {standing.achieved ? (
        <p className="mt-2 text-caption text-text-primary">
          {standing.days.length === 1
            ? `Caught it on ${standing.days[0].localDate}.`
            : `Most recently ${standing.days[0].localDate}.`}
        </p>
      ) : standing.closest !== null ? (
        <p className="mt-2 text-caption text-text-muted">
          Closest: {standing.closest.have} of {requiredCategories} on {standing.closest.localDate}.
        </p>
      ) : null}

      <p className="mt-2 text-caption text-text-muted">{definition.source}</p>
    </article>
  );
}

/** Prefer the ontology's own name for a single-species slot, so the two never disagree. */
function categoryLabel(category: SlamCategory): string {
  if (category.speciesIds.length === 1) {
    return speciesById(category.speciesIds[0])?.commonName ?? category.label;
  }
  return category.label;
}
