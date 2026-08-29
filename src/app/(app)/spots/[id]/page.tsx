import type { Metadata } from "next";

export const metadata: Metadata = { title: "Spot | Fish Log Book" };

export default function Page() {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h1 className="text-h1">Spot</h1>
      <p className="mt-3 text-body text-text-muted">One spot.</p>
    </section>
  );
}
