import type { Metadata } from "next";

import { LearningDashboard } from "@/features/learning/learning-dashboard";

/**
 * This route still exists and still compiles, but it is intentionally unlinked during
 * this development phase (2026-08-29): the "Learn & Build" entry was removed from
 * SHELL_ROUTES in src/features/shell/components/shell-nav.tsx, so nothing in the app
 * routes here anymore. The founder wants to revisit onboarding later.
 *
 * To relink it, re-add { href: "/learn", label: "Learn & Build" } to SHELL_ROUTES.
 */

export const metadata: Metadata = {
  title: "Learn & Build | Fish Log Book",
  description: "Explore the Fish Log Book user journey and prototype status.",
};

export default function LearnPage() {
  return <LearningDashboard />;
}
