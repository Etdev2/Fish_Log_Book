import type { Metadata } from "next";

import { OfflinePage } from "@/features/fish-legal/components/offline-page";

export const metadata: Metadata = {
  title: "Offline Pack & Sources — Fishing Log Book",
};

export default function Page() {
  return <OfflinePage />;
}
