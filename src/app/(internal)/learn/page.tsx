import type { Metadata } from "next";

import { LearningDashboard } from "@/features/learning/learning-dashboard";

export const metadata: Metadata = {
  title: "Learn & Build | Fish Log Book",
  description: "Explore the Fish Log Book user journey and prototype status.",
};

export default function LearnPage() {
  return <LearningDashboard />;
}
