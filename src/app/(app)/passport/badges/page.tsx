import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BadgeList } from "@/features/passport/components/badge-list";
import { PASSPORT_V1 } from "@/features/passport/flag";

export const metadata: Metadata = { title: "Badges | Fish Log Book" };

export default function BadgesPage() {
  if (!PASSPORT_V1) notFound();
  return <BadgeList />;
}
