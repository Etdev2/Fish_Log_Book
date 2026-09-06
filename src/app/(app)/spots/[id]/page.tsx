import type { Metadata } from "next";

import { BackLink } from "@/components/back-link";

export const metadata: Metadata = { title: "Spot | Fish Log Book" };

/**
 * A placeholder is still a page an angler can land on — from a stale link, from history,
 * from a mistyped URL — and a placeholder with no way out is the worst version of one.
 */
export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/spots" label="Spots" />
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Spot</h1>
        <p className="mt-3 text-body text-text-muted">One spot.</p>
      </section>
    </div>
  );
}
