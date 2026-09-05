import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FishIdHome } from "@/features/fish-id/components/fish-id-home";
import { FIN_ID } from "@/features/wildlife/flag";

export const metadata: Metadata = { title: "Fish ID | Fish Log Book" };

export default function FishIdPage() {
  if (!FIN_ID) notFound();
  return <FishIdHome />;
}
