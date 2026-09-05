"use client";

import Link from "next/link";

import type { CollectionDefinition, CollectionProgress } from "@/core/rules/passport/types";

import { usePassport } from "../data";
import { CARD_CLASS } from "../ui-classes";

/**
 * Every collection (founder request 2026-09-03).
 *
 * Grouped by kind so a long list stays readable, and regional collections keep the
 * region-first ordering the data layer applies — the angler's own water at the top, the
 * rest still visible because a Californian who fishes Baja in July should find it.
 */
export function CollectionList() {
  const { hydrated, collections } = usePassport();

  const groups = [
    { key: "region", title: "Where you fish", blurb: "The fish a place is known for." },
    { key: "family", title: "Families", blurb: "Related fish, wherever you catch them." },
    { key: "habitat", title: "Water", blurb: "Grouped by the kind of water they live in." },
  ] as const;

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
        <h1 className="text-h1">Collections</h1>
        <p className="mt-1 text-body text-text-muted" aria-live="polite">
          {hydrated
            ? `${collections.filter((c) => c.progress.complete).length} of ${collections.length} complete.`
            : "Reading your log…"}
        </p>
      </section>

      {groups.map((group) => {
        const rows = collections.filter((c) => c.definition.collectionType === group.key);
        if (rows.length === 0) return null;

        return (
          <section key={group.key} className={`${CARD_CLASS} p-4`}>
            <h2 className="text-h3">{group.title}</h2>
            <p className="mt-1 text-caption text-text-muted">{group.blurb}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {rows.map((row) => (
                <li key={row.definition.id}>
                  <CollectionRow definition={row.definition} progress={row.progress} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function CollectionRow({
  definition,
  progress,
}: {
  definition: CollectionDefinition;
  progress: CollectionProgress;
}) {
  return (
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
  );
}
