import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FinId } from "@/features/wildlife/components/fin-id";
import { FIN_ID } from "@/features/wildlife/flag";

export const metadata: Metadata = { title: "Whale & dolphin ID | Fish Log Book" };

/**
 * /fin-id — the marine mammal identifier (passport spec §17, §20).
 *
 * Its own route rather than a Fish Legal sub-page: nothing here is a legal question, and
 * filing "what was that whale" under regulations would be the wrong mental model. Reached
 * from the Legal home, which is where identification already lives, until wildlife has a
 * surface of its own.
 */
export default function FinIdPage() {
  if (!FIN_ID) notFound();
  return <FinId />;
}
