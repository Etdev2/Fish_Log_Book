import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PackWizard } from "@/features/fish-id/components/pack-wizard";
import { fishPackById } from "@/features/fish-id/packs";
import { FIN_ID } from "@/features/wildlife/flag";

type Params = Promise<{ packId: string }>;

export const metadata: Metadata = { title: "Fish ID | Fish Log Book" };

export default async function FishIdPackPage({ params }: { params: Params }) {
  if (!FIN_ID) notFound();
  const { packId } = await params;
  const pack = fishPackById(packId);
  if (pack === null) notFound();
  return <PackWizard pack={pack} />;
}
