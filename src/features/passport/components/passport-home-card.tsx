"use client";

import Link from "next/link";

import { speciesById } from "@/core/ontology/species";

import { usePassport } from "../data";
import { CARD_CLASS, SECONDARY_BUTTON } from "../ui-classes";

/**
 * The passport's card on the Calendar home page.
 *
 * Deliberately one line of substance and a link. The calendar is the home surface (D23)
 * and this must not compete with it — the card exists so an angler *sees* their collection
 * exists without hunting for it in Settings, which is the cheap test of whether the
 * passport deserves a permanent place in the navigation later (spec §8.1).
 *
 * It says something real or it says nothing worth reading, so the empty state is a plain
 * invitation rather than a row of zeroes.
 */
export function PassportHomeCard() {
  const { hydrated, totals, slams } = usePassport();

  if (!hydrated) return null;

  const newest = totals.latestNewSpecies;
  const newestName =
    newest !== null ? (speciesById(newest.speciesId)?.commonName ?? null) : null;

  // The nearest unfinished slam, and only when someone has actually started one.
  const nearest = slams
    .filter((s) => !s.standing.achieved && s.standing.closest !== null)
    .sort((a, b) => (b.standing.closest?.have ?? 0) - (a.standing.closest?.have ?? 0))[0];

  return (
    <section className={`${CARD_CLASS} p-4`}>
      <h2 className="text-h3">Passport</h2>

      {totals.uniqueSpecies === 0 ? (
        <p className="mt-2 text-body text-text-muted">
          Your species collection builds itself from your log. Nothing to fill in.
        </p>
      ) : (
        <>
          <p className="mt-2 text-body">
            <span className="text-text-primary">
              {totals.uniqueSpecies} {totals.uniqueSpecies === 1 ? "species" : "species"}
            </span>{" "}
            <span className="text-text-muted">
              from {totals.totalCatches} {totals.totalCatches === 1 ? "catch" : "catches"}
            </span>
          </p>
          {newestName !== null ? (
            <p className="mt-1 text-caption text-text-muted">
              Newest: {newestName} · {newest?.caughtAt.slice(0, 10)}
            </p>
          ) : null}
          {nearest !== undefined ? (
            <p className="mt-1 text-caption text-text-muted">
              {nearest.definition.name}: {nearest.standing.closest?.have} of{" "}
              {nearest.standing.required} on {nearest.standing.closest?.localDate}
            </p>
          ) : null}
        </>
      )}

      <Link href="/passport" className={`${SECONDARY_BUTTON} mt-3`}>
        Open Passport
      </Link>
    </section>
  );
}
