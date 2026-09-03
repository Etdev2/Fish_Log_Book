import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PassportOverview } from "@/features/passport/components/passport-overview";
import { PASSPORT_V1 } from "@/features/passport/flag";

export const metadata: Metadata = { title: "Passport | Fish Log Book" };

/**
 * /passport — the overview (spec §8.1, §8.2).
 *
 * Reached from Settings and from a species, deliberately not from the nav bar: spec §8.1
 * keeps Phase 1 out of the six-destination bar, and `shell-nav.test.ts` pins that count so
 * a seventh tab needs a decision rather than a patch.
 */
export default function PassportPage() {
  if (!PASSPORT_V1) notFound();
  return <PassportOverview />;
}
