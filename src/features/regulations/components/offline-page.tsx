"use client";

import { SOCAL } from "../reg-data";

/**
 * Offline & dataset status (founder spec §11, §23): what is ON this device, its trust
 * stamp, and the stated floor/ceiling — the bundle is the floor; Supabase sync +
 * IndexedDB/SQLite storage upgrades it later without breaking offline catches.
 */
export function OfflinePage() {
  const pack = SOCAL.pack;
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Offline &amp; sources</h1>
        <p className="mt-1 text-caption text-text-muted">
          {pack.notes}
        </p>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">On this device</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-body">
          <div>
            <dt className="text-caption text-text-muted">Pack</dt>
            <dd className="font-semibold">{pack.id} · v{pack.version}</dd>
          </div>
          <div>
            <dt className="text-caption text-text-muted">Published / verified</dt>
            <dd className="font-semibold">{pack.publishedAt.slice(0, 10)}</dd>
          </div>
          <div>
            <dt className="text-caption text-text-muted">Areas</dt>
            <dd className="font-semibold">{SOCAL.areas.length} lines &amp; polygons</dd>
          </div>
          <div>
            <dt className="text-caption text-text-muted">Verified rules</dt>
            <dd className="font-semibold">{SOCAL.rules.length} rows</dd>
          </div>
        </dl>
        <p className="mt-3 text-caption text-text-muted">
          Everything the Regulations pages answer comes from this pack — no signal needed.
          Cards pronounce themselves stale past each species&rsquo; verification horizon instead
          of going silent.
        </p>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Where the law lives</h2>
        <ul className="mt-2 flex flex-col gap-2 text-body">
          <li>
            <a className="text-text-link underline decoration-dotted underline-offset-4" target="_blank" rel="noreferrer" href="https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern">
              CDFW — Southern California ocean sportfishing summary ↗
            </a>
          </li>
          <li>
            <a className="text-text-link underline decoration-dotted underline-offset-4" target="_blank" rel="noreferrer" href="https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary">
              CDFW — 2026 Groundfish Summary ↗
            </a>
          </li>
          <li>
            <a className="text-text-link underline decoration-dotted underline-offset-4" target="_blank" rel="noreferrer" href="https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern#recreational-groundfish-regulations">
              CDFW — real-time Groundfish Regulations page (same agency, watch this one mid-season) ↗
            </a>
          </li>
          <li>
            <a className="text-text-link underline decoration-dotted underline-offset-4" target="_blank" rel="noreferrer" href="https://www.fisheries.noaa.gov/west-coast/sustainable-fisheries/west-coast-groundfish-closed-areas">
              NOAA — West Coast groundfish closed-area WAYPOINT definitions ↗
            </a>
          </li>
        </ul>
        <p className="mt-3 text-caption text-text-muted">
          This app summarizes; those pages are the law&rsquo;s voice. When they disagree, the
          law wins and the pack gets a version bump.
        </p>
      </section>
    </div>
  );
}
