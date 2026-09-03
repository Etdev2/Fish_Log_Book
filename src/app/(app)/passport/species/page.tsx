import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SpeciesGrid } from "@/features/passport/components/species-grid";
import { PASSPORT_V1 } from "@/features/passport/flag";

export const metadata: Metadata = { title: "My Species | Fish Log Book" };

export default function MySpeciesPage() {
  if (!PASSPORT_V1) notFound();

  return (
    <div className="flex flex-col gap-4">
      <nav>
        <Link
          href="/passport"
          className="inline-flex min-h-touch-floor items-center text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
        >
          ← Passport
        </Link>
      </nav>
      <h1 className="text-h1">My Species</h1>
      <SpeciesGrid />
    </div>
  );
}
