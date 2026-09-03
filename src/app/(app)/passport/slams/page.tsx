import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SlamList } from "@/features/passport/components/slam-list";
import { PASSPORT_V1 } from "@/features/passport/flag";

export const metadata: Metadata = { title: "Slams | Fish Log Book" };

export default function SlamsPage() {
  if (!PASSPORT_V1) notFound();
  return <SlamList />;
}
