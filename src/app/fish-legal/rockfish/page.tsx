import type { Metadata } from "next";

import { RockfishWizard } from "@/features/fish-legal/components/rockfish-wizard";

export const metadata: Metadata = {
  title: "Identify a Rockfish — Fishing Log Book",
};

export default function Page() {
  return <RockfishWizard />;
}
