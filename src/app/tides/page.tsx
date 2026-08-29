import type { Metadata } from "next";

import { TideChart } from "@/features/conditions/tide-chart";

export const metadata: Metadata = { title: "Tide | Fish Log Book" };

export default function TidesPage() {
  return <TideChart />;
}
