import type { Metadata } from "next";

import { BackLink } from "@/components/back-link";
import { BoundaryMap } from "@/features/fish-legal/components/boundary-map";

export const metadata: Metadata = {
  title: "Depth & Boundary Rules — Fishing Log Book",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      {/* Every Fish Legal screen is one level below its home. Until this round these pages had
          no way back and no bottom bar at all — they sat outside the (app) group, so a tap
          from the Legal tab landed you on a page with no navigation on it whatsoever. */}
      <BackLink href="/fish-legal" label="Fish Legal" />
      <BoundaryMap />
    </div>
  );
}
