import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CollectionList } from "@/features/passport/components/collection-list";
import { PASSPORT_V1 } from "@/features/passport/flag";

export const metadata: Metadata = { title: "Collections | Fish Log Book" };

export default function CollectionsPage() {
  if (!PASSPORT_V1) notFound();
  return <CollectionList />;
}
