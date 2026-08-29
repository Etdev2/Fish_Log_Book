import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trip | Fish Log Book" };

export default function Page() {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h1 className="text-h1">Trip</h1>
      <p className="mt-3 text-body text-text-muted">Marks, catches, the sticky rig (D21a) and the conditions captured at each moment.</p>
    </section>
  );
}
