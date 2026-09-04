import type { Metadata } from "next";
import Link from "next/link";

import { StationPicker } from "@/features/conditions/components/station-picker";
import { PASSPORT_V1 } from "@/features/passport/flag";
import { BackendDiagnostics } from "@/features/settings/components/backend-diagnostics";
import { QuickMarkToggle } from "@/features/settings/components/quick-mark-toggle";
import { RegionSelect } from "@/features/settings/components/region-select";
import { UnitsToggle } from "@/features/settings/components/units-toggle";

export const metadata: Metadata = { title: "Settings | Fish Log Book" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Settings</h1>
        <p className="mt-3 text-body text-text-muted">
          Account and the platform selector (D26) land with the rest of the settings feature.
        </p>
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Tide station</h2>
        <p className="mt-2 text-body text-text-muted">
          Which NOAA station the tide chart reads. Predictions are fetched when you have
          signal and kept on this device for when you do not.
        </p>
        <label className="mt-3 flex flex-col gap-1">
          <span className="sr-only">Tide station</span>
          <StationPicker />
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
            Every species you have caught, your personal bests, and how far along each family is.
            Built from catches you have already logged.
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
          Name the lures you reach for most, then keep favorites ready for your next rig.
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
          Extra one-tap controls for the water. Off by default so they do not take up room
          you have not asked them to.
        </p>
        <QuickMarkToggle />
        <p className="mt-2 text-caption text-text-muted">
          Quickly record that something happened while fishing and add the details later.
          Marks appear in the Fish Log under &ldquo;Needs details&rdquo;.
        </p>
      </section>

      {/*
        Fishing region: which species the picker's "Common" row leads with (founder
        requirements §4). Suggestions only — the full vocabulary is always searchable.
      */}
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Fishing region</h2>
        <p className="mt-2 mb-4 text-body text-text-muted">
          Sets the species suggested first when you log a catch. Every species stays
          searchable wherever you fish — this only changes what is one tap away.
        </p>
        <RegionSelect />
      </section>

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Height units</h2>
        <p className="mt-2 mb-4 text-body text-text-muted">
          Choose how tide heights and rates are shown. This does not change how anything is stored.
        </p>
        <UnitsToggle />
      </section>

      {/*
        The notices are reachable from Settings as well as from Fish Legal: somebody
        looking for a privacy policy looks here, not inside a regulations screen.
      */}
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Notices</h2>
        <p className="mt-2 text-body text-text-muted">
          What this app is, what it is not, and what happens to your log. Your fishing log
          is stored on this device; there is no analytics or advertising anywhere in the app.
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
