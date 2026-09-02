import type { Metadata } from "next";

import { BoundaryMap } from "@/features/fish-legal/components/boundary-map";

export const metadata: Metadata = {
  title: "Depth & Boundary Rules — Fishing Log Book",
};

export default function Page() {
  return <BoundaryMap />;
}
