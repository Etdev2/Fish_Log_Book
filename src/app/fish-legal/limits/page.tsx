import type { Metadata } from "next";

import { LimitsPage } from "@/features/fish-legal/components/limits-page";

export const metadata: Metadata = { title: "Today's Limits — Fish Legal" };

export default function Page() {
  return <LimitsPage />;
}
