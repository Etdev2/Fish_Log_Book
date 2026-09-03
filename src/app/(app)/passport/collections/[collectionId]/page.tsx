import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionDetail } from "@/features/passport/components/collection-detail";
import { PASSPORT_V1 } from "@/features/passport/flag";

type Params = Promise<{ collectionId: string }>;

export const metadata: Metadata = { title: "Collection | Fish Log Book" };

export default async function CollectionPage({ params }: { params: Params }) {
  if (!PASSPORT_V1) notFound();
  const { collectionId } = await params;
  return <CollectionDetail collectionId={collectionId} />;
}
