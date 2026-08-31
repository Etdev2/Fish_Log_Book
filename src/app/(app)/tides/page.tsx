import type { Metadata } from "next";

import { TideScreen } from "@/features/conditions/tide-screen";

export const metadata: Metadata = { title: "Tide | Fish Log Book" };

export default function TidesPage() {
  return <TideScreen />;
}
