import type { Metadata } from "next";

import { TackleBox } from "@/features/tackle/components/tackle-box";

export const metadata: Metadata = {
  title: "Tackle Box | Fish Log Book",
  description: "A personal, session-only tackle inventory for the Fish Log Book prototype.",
};

export default function TacklePage() {
  return <TackleBox />;
}
