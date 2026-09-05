import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SpeciesDetail } from "@/features/passport/components/species-detail";
import { PASSPORT_V1 } from "@/features/passport/flag";

type Params = Promise<{ speciesId: string }>;

export const metadata: Metadata = { title: "Species | Fish Log Book" };

/**
 * One species, for one angler (spec §9.2).
 *
 * An unknown id renders an honest "not in the vocabulary" rather than a 404, matching the
 * catch detail route: the species may simply be newer than this device's copy.
 */
export default async function PassportSpeciesPage({ params }: { params: Params }) {
  if (!PASSPORT_V1) notFound();
  const { speciesId } = await params;
  return <SpeciesDetail speciesId={speciesId} unitSystem="imperial" />;
}
