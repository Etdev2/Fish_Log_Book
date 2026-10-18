import type { Metadata } from "next";

import { BackLink } from "@/components/back-link";
import { RockfishCatalog } from "@/features/fish-legal/components/rockfish-catalog";

export const metadata: Metadata = {
  title: "Rockfish catalog — Fishing Log Book",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/fish-legal/rockfish" label="Identify a rockfish" />
      <RockfishCatalog />
    </div>
  );
}
