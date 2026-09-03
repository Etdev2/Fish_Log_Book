"use client";

import Link from "next/link";

import { speciesById } from "@/core/ontology/species";

import { usePassport } from "../data";
import { CARD_CLASS, SECONDARY_BUTTON } from "../ui-classes";

/**
 * The passport overview (spec §8.2).
 *
 * Every card here leads somewhere real — a species, a collection, a badge. Spec §8.2 is
 * explicit that this must not become a feed of generic achievements, so there is no
 * activity list and no "you're on a roll" copy.
 */
export function PassportOverview() {
  const { hydrated, totals, collections, badges, slams, nearestGoals } = usePassport();
  const earned = badges.filter((b) => b.earned);
  const newest = totals.latestNewSpecies;
  const slamsDone = slams.filter((s) => s.standing.achieved).length;
  // The single closest near miss, and only if someone has actually started one.
  const nearestSlam = slams
    .filter((s) => !s.standing.achieved && s.standing.closest !== null)
    .sort((a, b) => (b.standing.closest?.have ?? 0) - (a.standing.closest?.have ?? 0))[0];
  const newestName =
    newest !== null ? (speciesById(newest.speciesId)?.commonName ?? newest.speciesId) : null;

  return (
    <div className="flex flex-col gap-4">
      <section className={`${CARD_CLASS} p-4`}>
        <h1 className="text-h1">Passport</h1>
        <p className="mt-1 text-body text-text-muted">
          Everything you have caught, built from your log.
        </p>

        {!hydrated ? (
          <p className="mt-3 text-body text-text-muted">Reading your log…</p>
        ) : (
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Species" value={String(totals.uniqueSpecies)} />
            <Stat label="Catches" value={String(totals.totalCatches)} />
            <Stat label="Released" value={String(totals.releasedCount)} />
            <Stat label="Kept" value={String(totals.keptCount)} />
          </dl>
        )}
      </section>

      {hydrated && totals.uniqueSpecies === 0 ? (
        <section className={`${CARD_CLASS} p-4`}>
          <h2 className="text-h3">Nothing here yet</h2>
          <p className="mt-2 text-body text-text-muted">
            Log a fish and it appears here. Everything on this page is built from catches you
            have already recorded — there is nothing extra to fill in.
          </p>
          <Link href="/log" className={`${SECONDARY_BUTTON} mt-3`}>
            Open the log
          </Link>
        </section>
      ) : null}

      {newestName !== null ? (
        <section className={`${CARD_CLASS} p-4`}>
          <h2 className="text-h3">Newest species</h2>
          <p className="mt-2 text-body">
            <Link
              href={`/passport/species/${newest?.speciesId}`}
              className="text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
            >
              {newestName}
            </Link>{" "}
            <span className="text-text-muted">· {newest?.caughtAt.slice(0, 10)}</span>
          </p>
        </section>
      ) : null}

      {nearestGoals.length > 0 ? (
        <section className={`${CARD_CLASS} p-4`}>
          <h2 className="text-h3">Closest to done</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {nearestGoals.map((goal) => (
              <li key={`${goal.kind}-${goal.id}`}>
                <Link
                  href={goal.href}
                  className="flex min-h-touch-floor items-center justify-between gap-3 rounded-md border border-hairline px-3 text-body transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
                >
                  <span>{goal.name}</span>
                  <span className="text-caption text-text-muted">
                    {goal.current} of {goal.target}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={`${CARD_CLASS} p-4`}>
        <h2 className="text-h3">Collections</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {collections.map(({ definition, progress }) => (
            <li key={definition.id}>
              <Link
                href={`/passport/collections/${definition.id}`}
                className="flex min-h-touch-floor items-center justify-between gap-3 rounded-md border border-hairline px-3 text-body transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
              >
                <span>{definition.name}</span>
                <span className="text-caption text-text-muted">
                  {progress.caught} of {progress.required}
                  {progress.complete ? " · complete" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/*
        Slams sit above badges deliberately: a trifecta is the thing an angler actually
        talks about in the parking lot, and the near-miss line is the strongest reason on
        this page to go out again.
      */}
      <section className={`${CARD_CLASS} p-4`}>
        <h2 className="text-h3">Slams</h2>
        <p className="mt-2 text-body text-text-muted">
          Several species, one day. {slamsDone} of {slams.length} done.
        </p>
        {nearestSlam !== undefined ? (
          <p className="mt-2 text-caption text-text-muted">
            Closest: {nearestSlam.definition.name} — {nearestSlam.standing.closest?.have} of{" "}
            {nearestSlam.standing.required} on {nearestSlam.standing.closest?.localDate}.
          </p>
        ) : null}
        <Link href="/passport/slams" className={`${SECONDARY_BUTTON} mt-3`}>
          See slams
        </Link>
      </section>

      <section className={`${CARD_CLASS} p-4`}>
        <h2 className="text-h3">Badges</h2>
        <p className="mt-2 text-body text-text-muted">
          {earned.length} of {badges.length} earned.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/passport/badges" className={SECONDARY_BUTTON}>
            See badges
          </Link>
          <Link href="/passport/species" className={SECONDARY_BUTTON}>
            My Species
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-text-muted">{label}</dt>
      <dd className="text-h2 text-text-primary">{value}</dd>
    </div>
  );
}
