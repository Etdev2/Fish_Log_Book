import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PASSPORT_V1 } from "@/features/passport/flag";
import { BackendDiagnostics } from "@/features/settings/components/backend-diagnostics";
import { QuickMarkToggle } from "@/features/settings/components/quick-mark-toggle";
import { RegionSelect } from "@/features/settings/components/region-select";
import { TideStationSetting } from "@/features/settings/components/tide-station-setting";
import { UnitsToggle } from "@/features/settings/components/units-toggle";

export const metadata: Metadata = { title: "Settings | Fish Log Book" };

/**
 * Two of these controls — the tide station and the fishing region — are steps 1 and 2 of
 * guided setup, and both now walk the angler back to the checklist when setup is what
 * sent them. Reading that errand means reading the query string, so each sits behind its
 * own `Suspense` boundary: the rest of this page still prerenders, which is the whole
 * point of ADR 005 §5. The fallback is the select's own height, so nothing jumps.
 */
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Settings</h1>
      </section>

      <section id="tide-station" className="scroll-mt-space-16 rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Tide station</h2>
        <p className="mt-2 text-body text-text-muted">
          The station your tide chart uses.
        </p>
        <label className="mt-3 flex flex-col gap-1">
          <span className="sr-only">Tide station</span>
          <Suspense fallback={<div className="min-h-touch-floor" />}>
            <TideStationSetting />
          </Suspense>
        </label>
      </section>

      {/*
        Passport's entry point. Spec §8.1 keeps it out of the nav bar in Phase 1 — the bar
        is full at six and `shell-nav.test.ts` pins that — so it is reached from here, and
        from a species' own page.
      */}
      {PASSPORT_V1 ? (
        <section className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">Passport</h2>
          <p className="mt-2 text-body text-text-muted">
            Every fish you have caught, and your bests.
          </p>
          <Link
            href="/passport"
            className="mt-4 inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none"
          >
            Open Passport
          </Link>
        </section>
      ) : null}

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Tackle</h2>
        <p className="mt-2 text-body text-text-muted">
          Your lures and favorite rigs.
        </p>
        <Link
          href="/tackle"
          className="mt-4 inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none"
        >
          Open Tackle Box
        </Link>
      </section>

      {/*
        Fishing shortcuts: accelerators that stay out of the way until asked for. Off by
        default, so the app is simple for everyone and fast for the people who want it.
      */}
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Fishing shortcuts</h2>
        <p className="mt-2 mb-4 text-body text-text-muted">
          One-tap extras for the water. Off by default.
        </p>
        <QuickMarkToggle />
        <p className="mt-2 text-caption text-text-muted">
          Mark a moment now, add details later.
        </p>
      </section>

      {/*
        Fishing region: which species the picker's "Common" row leads with (founder
        requirements §4). Suggestions only — the full vocabulary is always searchable.
      */}
      <section id="fishing-region" className="scroll-mt-space-16 rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Fishing region</h2>
        <p className="mt-2 mb-4 text-body text-text-muted">
          Fish suggested first when you log a catch.
        </p>
        <Suspense fallback={<div className="min-h-touch-floor" />}>
          <RegionSelect />
        </Suspense>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="mb-4 text-h3">Height units</h2>
        <UnitsToggle />
      </section>

      {/*
        The way back into guided setup. It is here because Settings is where somebody goes
        when they want to redo a thing they did once — and because the old checklist, which
        lived on the calendar and deleted itself when finished, had no way back in at all.
      */}
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Setup guide</h2>
        <p className="mt-2 text-body text-text-muted">
          Check or redo your setup.
        </p>
        <Link
          href="/onboarding"
          className="mt-4 inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none"
        >
          Open setup guide
        </Link>
      </section>

      {/*
        The notices are reachable from Settings as well as from Fish Legal: somebody
        looking for a privacy policy looks here, not inside a regulations screen.
      */}
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Notices</h2>
        <p className="mt-2 text-body text-text-muted">
          {/* Accuracy beats brevity here: signed-in logs sync (documents.ts, privacy). */}
          Saved on this device, synced if you sign in. No ads or analytics.
        </p>
        <Link
          href="/legal"
          className="mt-4 inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none"
        >
          Terms, privacy &amp; fishing rules
        </Link>
      </section>

      <BackendDiagnostics />
    </div>
  );
}
