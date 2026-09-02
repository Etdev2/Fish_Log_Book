import type { Metadata } from "next";

import { OfflinePage } from "@/features/regulations/components/offline-page";

export const metadata: Metadata = {
  title: "Offline Pack & Sources — Fishing Log Book",
};

export default function Page() {
  return <OfflinePage />;
}
