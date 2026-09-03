"use client";

import Link from "next/link";

import { speciesById } from "@/core/ontology/species";

import { usePassport } from "../data";
import { CARD_CLASS, SECONDARY_BUTTON } from "../ui-classes";

/**
 * One collection (spec §11).
 *
 * Informational-only species are listed apart from the required ones and labelled, so the
 * screen can never read as "go and catch this protected fish to finish the set".
 */
export function CollectionDetail({ collectionId }: { collectionId: string }) {
  const { hydrated, collections, caughtSpeciesIds } = usePassport();
  const standing = collections.find((c) => c.definition.id === collectionId);

  if (standing === undefined) {
    return (
      <div className={`${CARD_CLASS} p-4`}>
        <h1 className="text-h1">Collection not found</h1>
        <Link href="/passport" className={`${SECONDARY_BUTTON} mt-4`}>
          Back to Passport
        </Link>
      </div>
    );
  }

  const { definition, progress } = standing;
  const required = definition.species.filter((s) => !s.informationalOnly);
  const informational = definition.species.filter((s) => s.informationalOnly);

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
        <h1 className="text-h1">{definition.name}</h1>
        <p className="mt-1 text-body text-text-muted">{definition.description}</p>
        <p className="mt-3 text-body-strong" aria-live="polite">
          {hydrated
            ? `${progress.caught} of ${progress.required}${progress.complete ? " · complete" : ""}`
            : "Reading your log…"}
        </p>
      </section>

      <section className={`${CARD_CLASS} p-4`}>
        <h2 className="text-h3">In this collection</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {required.map((entry) => (
            <SpeciesRow
              key={entry.speciesId}
              speciesId={entry.speciesId}
              caught={caughtSpeciesIds.has(entry.speciesId)}
            />
          ))}
        </ul>
      </section>

      {informational.length > 0 ? (
        <section className={`${CARD_CLASS} p-4`}>
          <h2 className="text-h3">Protected</h2>
          <p className="mt-2 text-body text-text-muted">
            These are in the family but never count toward finishing it. If you hook one, let it
            go.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {informational.map((entry) => (
              <SpeciesRow
                key={entry.speciesId}
                speciesId={entry.speciesId}
                caught={caughtSpeciesIds.has(entry.speciesId)}
                protectedSpecies
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SpeciesRow({
  speciesId,
  caught,
  protectedSpecies = false,
}: {
  speciesId: string;
  caught: boolean;
  protectedSpecies?: boolean;
}) {
  const species = speciesById(speciesId);
  if (species === null) return null;

  return (
    <li>
      <Link
        href={`/passport/species/${speciesId}`}
        className="flex min-h-touch-floor items-center justify-between gap-3 rounded-md border border-hairline px-3 text-body transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
      >
        <span className={caught ? "text-text-primary" : "text-text-muted"}>
          {species.commonName}
        </span>
        <span className="text-caption text-text-muted">
          {protectedSpecies ? "Protected" : caught ? "Caught" : "Not yet"}
        </span>
      </Link>
    </li>
  );
}
