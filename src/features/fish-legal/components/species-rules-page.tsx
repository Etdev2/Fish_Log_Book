"use client";

import { LegalNotice } from "@/components/legal-notice";
import Link from "next/link";
import { JurisdictionChip } from "./jurisdiction-chip";
import { useMemo } from "react";

import { useNow } from "@/lib/time/use-now";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { useRegionPreference } from "@/features/settings/region";
import { BackLink } from "@/components/back-link";
import { REGIONS } from "@/core/ontology/regions";
import { regulationCard, platformFor } from "../reg-engine";
import { packForRegion } from "../packs";
import { speciesDisplayName } from "../reg-species";
import { ROCKFISH_PROFILES } from "../rockfish-id";
import { speciesPhoto } from "../species-photos";
import { useFishingModePreference } from "../prefs";
import { RegulationCard } from "./regulation-card";
import { CHIP_OFF, CHIP_ON } from "@/features/catches/ui-classes";

/**
 * One species' Fish Legal profile (spec §5/§19): status word first, then limits,
 * then provenance, then law. ID help (photo + key features + confusable list) carries
 * its spec §10 weight — a wrong ID on an edge-slot fish is a citation, not a typo.
 *
 * The pack is resolved from the Settings region; a species the pack does not verify
 * renders "No verified data" forever (never folklore) with the region named out loud.
 */
export function SpeciesRulesPage({ speciesId }: { speciesId: string }) {
  const now = useNow();
  const zone = useLocalTimeZone() ?? "America/Los_Angeles";
  const [mode, setMode] = useFishingModePreference();
  const [region] = useRegionPreference();

  const dateKey = useMemo(() => {
    if (now === null) return "2026-01-01";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(Number(now));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }, [now, zone]);

  const bundle = useMemo(() => packForRegion(region), [region]);
  const card = useMemo(
    () =>
      bundle
        ? regulationCard(bundle.data, bundle.primaryAreaId, speciesId, dateKey, platformFor(mode))
        : // Rockfish-ID profiles link here even when the SoCal pack isn't selected; if
          // they resolve outside SoCal and the region has no pack, say so below.
          null,
    [bundle, speciesId, dateKey, mode],
  );
  const name = speciesDisplayName(speciesId);
  const profile = ROCKFISH_PROFILES.find((p) => p.speciesId === speciesId) ?? null;
  const photo = useMemo(() => speciesPhoto(speciesId), [speciesId]);
  const regionLabel = REGIONS.find((r) => r.id === region)?.label ?? "this region";

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/fish-legal/species" label="Species & limits" />

      <header className="rounded-lg border border-hairline bg-surface p-4">
        {photo ? (
          <figure className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- bundled local asset, offline-first */}
            <img
              src={photo.src}
              alt={`Identification photo: ${name}`}
              className="h-40 w-full rounded-md object-cover"
              width={640}
              height={320}
            />
            <figcaption className="mt-1 text-caption text-text-muted">
              {photo.credit} · {photo.license}
            </figcaption>
          </figure>
        ) : null}
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <h1 className="text-h1">{name}</h1>
          <JurisdictionChip prefix="Species" />
        </div>
        <p className="mt-1 text-caption text-text-muted">
          {bundle ? `${bundle.jurisdictionLabel} · ` : `No pack for ${regionLabel} · `}
          {dateKey}
        </p>
        {/* UI-1 #7: 48 px chips with 12 px gaps, not 22 px underlined words in a caption. */}
        <div role="group" aria-label="How are you fishing?" className="mt-3 flex flex-wrap gap-3">
          {(["boat", "kayak", "shore", "spearfishing"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`inline-flex min-h-touch-floor min-w-touch-floor items-center justify-center rounded-full border px-4 text-label capitalize focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                /* Filled orange when selected (same treatment as the Fish Legal home chips), so the
                   active mode reads by fill and text color, not by a border hue alone. */
                mode === m ? CHIP_ON : CHIP_OFF
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <LegalNotice kind="regulations" />
        </div>
      </header>

      {card ? (
        <RegulationCard card={card} />
      ) : (
        <section className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">No verified data</h2>
          <p className="mt-2 text-body text-text-muted">
            {bundle
              ? `The ${bundle.jurisdictionLabel} pack holds no verified rule for ${name} yet.`
              : `${regionLabel} has no verified pack yet.`}{" "}
            We don&rsquo;t paraphrase from memory — the agency pages are today&rsquo;s
            authority:
          </p>
          <a
            href={
              bundle?.regionId === "florida"
                ? "https://www.eregulations.com/florida/fishing/saltwater/"
                : "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern"
            }
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex min-h-touch-floor items-center text-label text-text-link underline decoration-dotted underline-offset-4"
          >
            Open the official regulations ↗
          </a>
        </section>
      )}

      {profile ? (
        <section className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">Know it by eye</h2>
          <ul className="mt-2 flex flex-col gap-1 text-body">
            {profile.keyFeatures.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <p className="mt-2 text-caption text-text-muted">
            Mix-ups happen: {profile.similarTo.map(speciesDisplayName).join(", ")}. If the one
            in your hand doesn&rsquo;t match the one in your head:
          </p>
          <Link
            href="/fish-legal/rockfish"
            className="inline-flex min-h-touch-floor items-center text-label text-text-link underline decoration-dotted underline-offset-4"
          >
            Run the identifier
          </Link>
        </section>
      ) : null}
    </div>
  );
}
