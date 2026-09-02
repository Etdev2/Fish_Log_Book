"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { INPUT_CLASS } from "@/features/catches/ui-classes";
import { regulationCard } from "../reg-engine";
import { SOCAL, speciesInPack } from "../reg-data";
import { speciesDisplayName } from "../reg-species";
import { useFishingModePreference } from "../prefs";
import { platformFor } from "../reg-engine";
import type { RegulationCard as Card } from "../types";

/**
 * Species & limits (founder spec §4/§15): search → tap → verdict card. The LIST itself
 * carries the verdict words on the right edge, so a familiar angler reads five species
 * of "can I keep this" without opening anything.
 *
 * Every row is built from today's date + the device mode chip. Absent species never
 * appear — absence means "no verified data" is a finding, shown on the card page, not
 * row-clutter here.
 */
export function SpeciesBrowser({ dateKey }: { dateKey: string }) {
  const [query, setQuery] = useState("");
  const [mode] = useFishingModePreference();
  const platform = platformFor(mode);

  const rows = useMemo(() => {
    const covered = speciesInPack();
    const withCards = covered
      .map((id) => ({
        id,
        name: speciesDisplayName(id),
        card: regulationCard(SOCAL, "ca-ocean-southern", id, dateKey, platform),
      }))
      .filter((r) => r.card !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return withCards;
    return withCards.filter((r) =>
      tokens.every((tok) => r.name.toLowerCase().includes(tok) || r.id.includes(tok)),
    );
  }, [query, dateKey, platform]);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-label text-text-muted">Which fish?</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="rockfish, halibut, seabass…"
          className={INPUT_CLASS}
          autoComplete="off"
        />
      </label>

      <ul className="flex flex-col gap-2">
        {rows.map(({ id, name, card }) => (
          <li key={id}>
            <Link
              href={`/regulations/species/${id}`}
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
