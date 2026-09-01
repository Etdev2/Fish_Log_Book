import type { Metadata } from "next";

import { RegulationsHome } from "@/features/regulations/components/regulations-home";

export const metadata: Metadata = {
  title: "Regulations & Fish ID — Fishing Log Book",
  description: "Verified California fishing rules with dates and sources, offshore.",
};

export default function Page() {
  return <RegulationsHome />;
}
