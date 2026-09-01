import type { Metadata } from "next";

import { FishLog } from "@/features/catches/components/fish-log";

export const metadata: Metadata = { title: "Fish Log | Fish Log Book" };

/**
 * /log — the Fish Log home (spec §8).
 *
 * A thin route, per ADR 003 §2: the page wires, the feature thinks. The whole surface is
 * client-rendered because every read comes from the device's own database (ADR 004 §1)
 * and there is nothing for a server to render.
 */
export default function FishLogPage() {
  // Unit preference lives on `angler.unit_preference` and is not wired to a session yet;
  // imperial is the documented default (see the schema's `angler` table).
  return <FishLog unitSystem="imperial" />;
}
