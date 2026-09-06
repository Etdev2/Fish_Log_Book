import type { Metadata } from "next";

import { RegulationsHome } from "@/features/fish-legal/components/regulations-home";

export const metadata: Metadata = {
  title: "Fish Legal — Fishing Log Book",
  description: "Verified California fishing rules with dates and sources, offshore.",
};

export default function Page() {
  return <RegulationsHome />;
}
