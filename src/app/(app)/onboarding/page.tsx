import type { Metadata } from "next";

import { OnboardingPage } from "@/features/setup/components/onboarding-page";

export const metadata: Metadata = {
  title: "Set up | Fish Log Book",
  description: "The six one-time steps that point Fish Log Book at your water and your gear.",
};

/**
 * /onboarding — guided setup, moved off the calendar and onto a page of its own
 * (founder call, 2026-09-06). Thin route, per ADR 003 §2.
 */
export default function Page() {
  return <OnboardingPage />;
}
