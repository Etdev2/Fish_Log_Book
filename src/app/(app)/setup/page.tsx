import type { Metadata } from "next";

import { SetupPage } from "@/features/setup/components/setup-page";

export const metadata: Metadata = { title: "Setup | Fish Log Book" };

/**
 * /setup — today's rods and today's places (spec §3, §4).
 *
 * Thin route, per ADR 003 §2. Everything it shows comes from the device's own store.
 */
export default function Page() {
  return <SetupPage />;
}
