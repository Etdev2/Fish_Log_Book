import type { Metadata } from "next";

export const metadata: Metadata = { title: "Day | Fish Log Book" };

export default function Page() {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h1 className="text-h1">Day</h1>
      <p className="mt-3 text-body text-text-muted">A day&rsquo;s journal, trips and marks. Today gets Start Fishing and the four verbs; a past day gets the backfill entry (D24).</p>
    </section>
  );
}
