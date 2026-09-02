"use client";

import { PACKS } from "../packs";

/**
 * Offline & dataset status (Fish Legal expansion §16, §17): what is ON this device,
 * per pack, with every pack's trust stamp. The bundle is the floor; packs are none of
 * them fetched at view-time.
 */
export function OfflinePage() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Offline &amp; sources</h1>
        <p className="mt-1 text-caption text-text-muted">
          Every region Fish Legal verifies ships as a numbered pack on this device. No
          signal offshore, same answers — and the cards tell you when their data gets old
          instead of going silent (spec §17: versions, never silent overwrites).
        </p>
      </section>

      {PACKS.map((p) => (
        <section key={p.data.pack.id} className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">{p.jurisdictionLabel}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-body">
            <div>
              <dt className="text-caption text-text-muted">Pack</dt>
              <dd className="font-semibold">{p.data.pack.id} · v{p.data.pack.version}</dd>
            </div>
            <div>
              <dt className="text-caption text-text-muted">Verified</dt>
              <dd className="font-semibold">{p.data.pack.publishedAt.slice(0, 10)}</dd>
            </div>
            <div>
              <dt className="text-caption text-text-muted">Areas / zones</dt>
              <dd className="font-semibold">{p.data.areas.length}</dd>
            </div>
            <div>
              <dt className="text-caption text-text-muted">Verified rules</dt>
              <dd className="font-semibold">{p.data.rules.length}</dd>
            </div>
          </dl>
          <p className="mt-3 text-caption text-text-muted">{p.data.pack.notes}</p>
        </section>
      ))}

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Where the law lives</h2>
        <ul className="mt-2 flex flex-col gap-2 text-body">
          <li>
            <a className="text-text-link underline decoration-dotted underline-offset-4" target="_blank" rel="noreferrer" href="https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern">
              CDFW — Southern California ocean sportfishing summary ↗
            </a>
          </li>
          <li>
            <a className="text-text-link underline decoration-dotted underline-offset-4" target="_blank" rel="noreferrer" href="https://myfwc.com/fishing/saltwater/recreational/">
              FWC — Florida Saltwater Recreational Regulations ↗
            </a>
          </li>
          <li>
            <a className="text-text-link underline decoration-dotted underline-offset-4" target="_blank" rel="noreferrer" href="https://www.eregulations.com/florida/fishing/saltwater/">
              FWC eRegulations — 2026 Florida Saltwater (official digest) ↗
            </a>
          </li>
          <li>
            <a className="text-text-link underline decoration-dotted underline-offset-4" target="_blank" rel="noreferrer" href="https://www.fisheries.noaa.gov/west-coast/sustainable-fisheries/west-coast-groundfish-closed-areas">
              NOAA — West Coast groundfish closed-area waypoint definitions ↗
            </a>
          </li>
        </ul>
        <p className="mt-3 text-caption text-text-muted">
          This app summarizes; those pages are the law&rsquo;s voice. When they disagree,
          the law wins and the pack gets a version bump.
        </p>
      </section>
    </div>
  );
}
