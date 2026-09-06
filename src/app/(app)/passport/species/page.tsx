import { BackLink } from "@/components/back-link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SpeciesGrid } from "@/features/passport/components/species-grid";
import { PASSPORT_V1 } from "@/features/passport/flag";

export const metadata: Metadata = { title: "My Species | Fish Log Book" };

export default function MySpeciesPage() {
  if (!PASSPORT_V1) notFound();

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/passport" label="Passport" />
      <h1 className="text-h1">My Species</h1>
      <SpeciesGrid />
    </div>
  );
}
