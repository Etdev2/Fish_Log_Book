import type { Metadata } from "next";

export const metadata: Metadata = { title: "Spots | Fish Log Book" };

export default function Page() {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h1 className="text-h1">Spots</h1>
      <p className="mt-3 text-body text-text-muted">The places you fish, and the coastline bearing each one stores underneath your own words (D20).</p>
    </section>
  );
}
