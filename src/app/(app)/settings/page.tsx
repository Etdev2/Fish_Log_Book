import type { Metadata } from "next";

import { BackendDiagnostics } from "@/features/settings/components/backend-diagnostics";

export const metadata: Metadata = { title: "Settings | Fish Log Book" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Settings</h1>
        <p className="mt-3 text-body text-text-muted">
          Account, units and the platform selector (D26) land with the settings feature.
        </p>
      </section>

      <BackendDiagnostics />
    </div>
  );
}
