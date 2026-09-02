"use client";

import { useMemo } from "react";

import { useRegionPreference } from "@/features/settings/region";
import { packForRegion } from "../packs";

/**
 * Founder ask (2026-09-02): the rules surfaces identify the jurisdiction they are
 * answering for — "Species & limits — FL" — so changing the Settings region visibly
 * renames which state's law you're reading. Rendered beside every rules-page heading.
 */
export function JurisdictionChip({ prefix }: { readonly prefix: string }) {
  const [region] = useRegionPreference();
  const bundle = useMemo(() => packForRegion(region), [region]);
  return (
    <span
      className="inline-flex items-center rounded-full border border-hairline bg-surface-raised px-2.5 py-0.5 text-label font-semibold text-text-muted"
      aria-label={
        bundle ? `Law source: ${bundle.jurisdictionLabel}` : "No verified pack for your region"
      }
    >
      {prefix} — {bundle ? bundle.shortCode : "no pack"}
    </span>
  );
}
