import type { Metadata } from "next";

import { BackLink } from "@/components/back-link";

export const metadata: Metadata = { title: "Trip | Fish Log Book" };

/** Reached from the Calendar or the Fish Log, so "back" is the Calendar. */
export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/" label="Calendar" />
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Trip</h1>
        <p className="mt-3 text-body text-text-muted">Marks, catches, the sticky rig (D21a) and the conditions captured at each moment.</p>
      </section>
    </div>
  );
}
