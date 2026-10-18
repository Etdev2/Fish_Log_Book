"use client";

import { useState } from "react";

import type { MatchBand } from "@/core/rules/identification/types";
import type { SpeciesPhoto } from "../species-photos";
import { SpeciesPicture } from "./species-picture";

/** The words a five-year-old reads instead of a percentage (ADR 007 §4). */
export const BAND_WORDS: Record<MatchBand, string> = {
  strong: "Best match",
  moderate: "Could be",
  weak: "Less likely",
};

const BAND_CLASS: Record<MatchBand, string> = {
  strong: "bg-signal-orange text-ink-on-orange",
  moderate: "border border-border-interactive text-text-primary",
  weak: "border border-hairline text-text-muted",
};

const FOCUS =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

/**
 * One possible fish on an ID screen: its picture first, then its name, then how sure.
 *
 * The picture is always showing, not behind a tap. "That's the one" is decided by looking,
 * and the old row hid the only thing worth looking at. The marks to check on the fish in
 * your hands sit behind "How to tell" so the list stays a list of pictures.
 */
export function CandidateCard({
  name,
  scientificName,
  warning,
  photo,
  band,
  children,
}: {
  name: string;
  scientificName: string | null;
  /** One line that must not be missed, in amber: "never keep", "stay 100 yards back". */
  warning: string | null;
  photo: SpeciesPhoto | null;
  band: MatchBand | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li
      className={`flex flex-col gap-3 rounded-lg border-2 p-3 ${
        band === "strong" ? "border-signal-orange" : "border-hairline"
      }`}
    >
      <SpeciesPicture photo={photo} name={name} />

      <div className="flex items-start gap-3">
        <span className="flex-1">
          <span className="block text-h3">{name}</span>
          {scientificName !== null ? (
            <span className="block text-caption italic text-text-muted">{scientificName}</span>
          ) : null}
        </span>
        {band !== null ? (
          <span className={`shrink-0 rounded-full px-3 py-1 text-label ${BAND_CLASS[band]}`}>
            {BAND_WORDS[band]}
          </span>
        ) : null}
      </div>

      {warning !== null ? (
        <p className="rounded-md border border-amber-flag p-2 text-body font-semibold text-amber-flag">
          {warning}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex min-h-touch-floor items-center justify-between rounded-md border border-hairline px-3 text-label text-text-link ${FOCUS}`}
      >
        How to tell
        <span aria-hidden>{open ? "▲" : "▼"}</span>
      </button>

      {open ? <div className="flex flex-col gap-3">{children}</div> : null}
    </li>
  );
}
