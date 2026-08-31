import type { Metadata } from "next";
import Link from "next/link";

import { BackendDiagnostics } from "@/features/settings/components/backend-diagnostics";
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

      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Height units</h2>
        <p className="mt-2 mb-4 text-body text-text-muted">
          Choose how tide heights and rates are shown. This does not change how anything is stored.
        </p>
        <UnitsToggle />
      </section>

      <BackendDiagnostics />
    </div>
  );
}
