"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { INPUT_CLASS } from "@/features/catches/ui-classes";
import { useRegionPreference } from "@/features/settings/region";
import { REGIONS } from "@/core/ontology/regions";
import { regulationCard, platformFor } from "../reg-engine";
import { JurisdictionChip } from "./jurisdiction-chip";
import { packForRegion } from "../packs";
import { speciesDisplayName } from "../reg-species";
import { useFishingModePreference } from "../prefs";
import type { RegulationCard as Card } from "../types";

/**
 * Species & limits (Fish Legal §5/§19 + former spec §4/§15): search → tap → verdict
 * card. The LIST carries the verdict words on the right edge so a familiar angler reads
 * five species of "can I keep this" without opening anything.
 *
 * Rows come from the pack resolved by the Settings region — swap region in Settings and
 * this list changes jurisdiction, which is the acceptance test the founder demoed
 * (spec §26.1). A region with no pack surfaces the honest "no verified data for X"
 * line at the top, not an empty list pretending to be empty.
 */
export function SpeciesBrowser({ dateKey }: { dateKey: string }) {
  const [query, setQuery] = useState("");
  const [mode] = useFishingModePreference();
  const [region] = useRegionPreference();
  const platform = platformFor(mode);
  const bundle = useMemo(() => packForRegion(region), [region]);

  const rows = useMemo(() => {
    if (!bundle) return [];
    const covered = new Set<string>();
    for (const r of bundle.data.rules) if (r.speciesId) covered.add(r.speciesId);
    for (const g of bundle.data.groups) for (const m of g.memberSpeciesIds) covered.add(m);

    const withCards = [...covered]
      .map((id) => ({
        id,
        name: speciesDisplayName(id),
        card: regulationCard(bundle.data, bundle.primaryAreaId, id, dateKey, platform),
      }))
      .filter((r) => r.card !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return withCards;
    return withCards.filter((r) =>
      tokens.every((tok) => r.name.toLowerCase().includes(tok) || r.id.includes(tok)),
    );
  }, [bundle, query, dateKey, platform]);

  const regionLabel = REGIONS.find((r) => r.id === region)?.label ?? "this region";

  return (
    <div className="flex flex-col gap-3">
      {!bundle ? (
        <p className="rounded-lg border border-hairline bg-surface p-4 text-body text-text-muted">
          No verified pack for {regionLabel} yet — Fish Legal shows only sourced,
          dated regulations. Nothing here is folklore.
        </p>
      ) : (
        <>
          <label className="flex flex-col gap-2">
            <span className="text-label text-text-muted">Which fish?</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="rockfish, redfish, halibut, snook…"
              className={INPUT_CLASS}
              autoComplete="off"
            />
          </label>

          <JurisdictionChip prefix="Species & limits" />
          <p className="text-caption text-text-muted">
            {bundle.jurisdictionLabel} · pack v{bundle.data.pack.version}, verified{" "}
            {bundle.data.pack.publishedAt.slice(0, 10)}
          </p>

          <ul className="flex flex-col gap-2">
            {rows.map(({ id, name, card }) => (
              <li key={id}>
                <Link
                  href={`/fish-legal/species/${id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface p-4 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
                >
                  <span className="text-body font-semibold">{name}</span>
                  <VerdictChip card={card as Card} />
                </Link>
              </li>
            ))}
            {rows.length === 0 ? (
              <li className="rounded-lg border border-hairline bg-surface p-4 text-body text-text-muted">
                No verified data for that search. The source pages know more than we do —
                check the official source before you keep anything.
              </li>
            ) : null}
          </ul>
        </>
      )}
    </div>
  );
}

export function VerdictChip({ card }: { card: Card }) {
  const look =
    card.verdict === "keep"
      ? "bg-success-green text-ink-on-orange"
      : card.verdict === "release"
        ? "bg-error-red-fill text-text-primary"
        : "bg-amber-flag text-ink-on-orange";
  const word = card.verdict === "keep" ? "KEEP" : card.verdict === "release" ? "RELEASE" : "CHECK";
  return (
    <span className={`rounded-full px-3 py-1 text-label font-semibold ${look}`}>
      {word}
      {card.bagDaily !== null && card.verdict !== "release" ? ` · ${card.bagDaily}` : ""}
    </span>
  );
}
