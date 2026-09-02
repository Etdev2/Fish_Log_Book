import type { Metadata } from "next";

import { AlertsPage } from "@/features/fish-legal/components/alerts-page";

export const metadata: Metadata = { title: "Fish Legal Alerts — Fishing Log Book" };

export default function Page() {
  return <AlertsPage />;
}
