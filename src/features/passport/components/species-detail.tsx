"use client";

import Link from "next/link";
import { useMemo } from "react";

import { speciesById } from "@/core/ontology/species";
import { collectionsForSpecies } from "@/core/rules/passport/collections";
import { formatLength, formatWeight, type UnitSystem } from "@/features/catches/format";
import { currentZone, useLog } from "@/features/catches/store";
import { speciesPhoto } from "@/features/fish-legal/species-photos";

import { usePassport } from "../data";
import { CARD_CLASS, SECONDARY_BUTTON } from "../ui-classes";

/**
 * One species, for one angler (passport spec §9.2, Ticket 4).
 *
 * This is the page the passport exists for. It is the first screen in the app that pays
 * an angler back for the work of logging: how many, how big, when they started, what the
 * fish came on. Everything on it is read from catches that are already in the log — no
 * new field, no new prompt, no new step at the water.
 *
 * What it does NOT do is draw conclusions from three fish. The most-used bait line only
 * appears once there is enough history to mean something; below that the honest answer is
 * to show the catches and let the angler read them. Existing sample-size stance (spec §9.2).
 */

/** Below this, "you mostly catch these on X" is a coincidence, not a pattern. */
const PATTERN_MINIMUM = 5;

export function SpeciesDetail({
  speciesId,
  unitSystem,
}: {
  speciesId: string;
  /**
   * Passed in the way `FishLog` takes it. The ft/m setting in Settings is the *depth*
   * preference and deliberately not this — a fish is reported the way the log reports it,
   * so the two screens can never disagree about the same fish.
   */
  unitSystem: UnitSystem;
}) {
  const species = speciesById(speciesId);
  const { hydrated, summaryOf } = usePassport();
  const log = useLog();

  const summary = summaryOf(speciesId);
  const photo = useMemo(() => speciesPhoto(speciesId), [speciesId]);
  const zone = currentZone();

  const catches = useMemo(
    () =>
      log.catches
        .filter((c) => c.species_id === speciesId && c.deleted_at === null)
        .sort((a, b) => Date.parse(b.caught_at) - Date.parse(a.caught_at)),
    [log.catches, speciesId],
  );

  const topBait = useMemo(() => {
    if (catches.length < PATTERN_MINIMUM) return null;
    const counts = new Map<string, number>();
    for (const record of catches) {
      for (const item of log.gear.filter((g) => g.catch_id === record.id && g.deleted_at === null)) {
        if (item.role !== "bait" && item.role !== "lure" && item.role !== "jig") continue;
        counts.set(item.label, (counts.get(item.label) ?? 0) + 1);
      }
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return ranked.length > 0 ? ranked[0] : null;
  }, [catches, log.gear]);

  if (species === null) {
    return (
      <div className={`${CARD_CLASS} p-4`}>
        <h1 className="text-h1">Species not found</h1>
        <p className="mt-2 text-body text-text-muted">
          This species is not in the vocabulary. It may have been renamed.
        </p>
        <Link href="/passport/species" className={`${SECONDARY_BUTTON} mt-4`}>
          Back to My Species
        </Link>
      </div>
    );
  }

  const collections = collectionsForSpecies(speciesId);

  return (
    <div className="flex flex-col gap-4">
      <nav>
        <Link
          href="/passport/species"
          className="inline-flex min-h-touch-floor items-center text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
        >
          ← My Species
        </Link>
      </nav>

      <section className={`${CARD_CLASS} p-4`}>
        {photo !== null ? (
          <figure className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- bundled local asset, offline-first */}
            <img
              src={photo.src}
              alt={`Identification photo: ${species.commonName}`}
              className="h-40 w-full rounded-md object-cover"
              width={640}
              height={320}
            />
            <figcaption className="mt-1 text-caption text-text-muted">
              {photo.credit} · {photo.license}
            </figcaption>
          </figure>
        ) : null}

        <h1 className="text-h1">{species.commonName}</h1>
        {species.scientificName !== null ? (
          <p className="mt-1 text-caption italic text-text-muted">{species.scientificName}</p>
        ) : null}

        <p className="mt-2 text-caption text-text-muted">
          {species.waterClass === "salt" ? "Saltwater" : "Freshwater"}
          {species.takeStatus === "protected" ? " · Protected — release it" : ""}
          {species.takeStatus === "regulated" ? " · Limits apply" : ""}
        </p>

        {!hydrated ? (
          <p className="mt-3 text-body text-text-muted">Reading your log…</p>
        ) : summary === null ? (
          <p className="mt-3 text-body text-text-muted">
            You have not logged one of these yet.
          </p>
        ) : null}
      </section>

      {summary !== null ? (
        <>
          <section className={`${CARD_CLASS} p-4`}>
            <h2 className="text-h3">Your record</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <Stat label="Catches" value={String(summary.catchCount)} />
              <Stat label="Fish" value={String(summary.fishCount)} />
              <Stat label="Released" value={String(summary.releasedCount)} />
              <Stat label="Kept" value={String(summary.keptCount)} />
            </dl>

            <dl className="mt-4 flex flex-col gap-3">
              <Stat
                label="Longest"
                value={
                  summary.bestLength !== null
                    ? `${formatLength(summary.bestLength.value, unitSystem) ?? "—"}${
                        summary.bestLength.estimated ? " (estimated)" : ""
                      }`
                    : "Not measured yet"
                }
              />
              <Stat
                label="Heaviest"
                value={
                  summary.bestWeight !== null
                    ? `${formatWeight(summary.bestWeight.value, unitSystem) ?? "—"}${
                        summary.bestWeight.estimated ? " (estimated)" : ""
                      }`
                    : "Not weighed yet"
                }
              />
              <Stat label="First caught" value={summary.firstCaughtAt.slice(0, 10)} />
              <Stat label="Most recent" value={summary.latestCaughtAt.slice(0, 10)} />
            </dl>

            {topBait !== null ? (
              <p className="mt-4 text-body text-text-muted">
                Most often on <span className="text-text-primary">{topBait[0]}</span> — {topBait[1]}{" "}
                of {catches.length} catches.
              </p>
            ) : (
              <p className="mt-4 text-caption text-text-muted">
                Once you have {PATTERN_MINIMUM} of these logged, this is where what they came on
                will show.
              </p>
            )}
          </section>

          <section className={`${CARD_CLASS} p-4`}>
            <h2 className="text-h3">Every one you have caught</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {catches.slice(0, 50).map((record) => (
                <li key={record.id}>
                  <Link
                    href={`/catch/${record.id}`}
                    className="flex min-h-touch-floor items-center justify-between gap-3 rounded-md border border-hairline px-3 text-body transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
                  >
                    <span>{record.local_date}</span>
                    <span className="text-caption text-text-muted">
                      {record.disposition === "released"
                        ? "Released"
                        : record.disposition === "kept"
                          ? "Kept"
                          : "Logged"}
                      {record.length_mm !== null
                        ? ` · ${formatLength(record.length_mm, unitSystem) ?? ""}`
                        : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {catches.length > 50 ? (
              <p className="mt-2 text-caption text-text-muted">
                Showing the 50 most recent of {catches.length}.
              </p>
            ) : null}
          </section>
        </>
      ) : null}

      {collections.length > 0 ? (
        <section className={`${CARD_CLASS} p-4`}>
          <h2 className="text-h3">Collections</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link href={`/passport/collections/${collection.id}`} className={SECONDARY_BUTTON}>
                  {collection.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={`${CARD_CLASS} p-4`}>
        <h2 className="text-h3">Before you keep one</h2>
        <p className="mt-2 text-body text-text-muted">
          Limits and seasons change. Check the current rules for where you are fishing.
        </p>
        <Link href={`/fish-legal/species/${species.id}`} className={`${SECONDARY_BUTTON} mt-3`}>
          Open Fish Legal
        </Link>
      </section>

      <p className="text-caption text-text-muted">Zone: {zone}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-text-muted">{label}</dt>
      <dd className="text-body-strong text-text-primary">{value}</dd>
    </div>
  );
}
