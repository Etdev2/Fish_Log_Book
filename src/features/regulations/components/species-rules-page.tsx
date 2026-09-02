"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useNow } from "@/lib/time/use-now";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { regulationCard, platformFor } from "../reg-engine";
import { SOCAL } from "../reg-data";
import { speciesDisplayName } from "../reg-species";
import { ROCKFISH_PROFILES } from "../rockfish-id";
import { useFishingModePreference } from "../prefs";
import { RegulationCard } from "./regulation-card";

/**
 * One species' regulation card (founder spec §4): verdict first, limits after,
 * citations under the fold, staleness on top of everything past its horizon.
 *
 * A species the pack does not cover gets the pack's permanent stance rendered in words
 * ("No verified data … the CDFW page is the answer today") — never an empty screen and
 * never folklore (data model §3).
 */
export function SpeciesRulesPage({ speciesId }: { speciesId: string }) {
  const now = useNow();
  const zone = useLocalTimeZone() ?? "America/Los_Angeles";
  const [mode, setMode] = useFishingModePreference();

  const dateKey = useMemo(() => {
    if (now === null) return "2026-01-01";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(Number(now));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }, [now, zone]);

  const card = useMemo(
    () => regulationCard(SOCAL, "ca-ocean-southern", speciesId, dateKey, platformFor(mode)),
    [speciesId, dateKey, mode],
  );
  const name = speciesDisplayName(speciesId);
  const profile = ROCKFISH_PROFILES.find((p) => p.speciesId === speciesId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <nav>
        <Link
          href="/regulations/species"
          className="inline-flex min-h-touch-floor items-center text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
        >
          ‹ Species &amp; limits
        </Link>
      </nav>

      <header className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">{name}</h1>
        <p className="mt-1 text-caption text-text-muted">
          For {dateKey} · Southern California pack ·{" "}
          <span className="inline-flex gap-2">
            {(["boat", "kayak", "shore", "spearfishing"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={mode === m ? "font-semibold text-text-link underline" : "underline decoration-dotted underline-offset-2"}
              >
                {m}
              </button>
            ))}
          </span>
        </p>
      </header>

      {card ? (
        <RegulationCard card={card} />
      ) : (
        <section className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">No verified data</h2>
          <p className="mt-2 text-body text-text-muted">
            This pack holds no verified rule for {name} yet. We don&rsquo;t paraphrase from
            memory — the CDFW Southern-region page is today&rsquo;s authority:
          </p>
          <a
            href="https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex min-h-touch-floor items-center text-label text-text-link underline decoration-dotted underline-offset-4"
          >
            Open the CDFW Southern-region summary ↗
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
            Mix-ups happen: {profile.similarTo.map(speciesDisplayName).join(", ")}.{" "}
            <Link href="/regulations/rockfish" className="text-text-link underline decoration-dotted underline-offset-4">
              Run the identifier
            </Link>{" "}
            if the one in your hand doesn&rsquo;t match the one in your head.
          </p>
        </section>
      ) : null}
    </div>
  );
}
