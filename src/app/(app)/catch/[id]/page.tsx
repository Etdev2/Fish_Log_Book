import type { Metadata } from "next";

import { CatchDetailClient } from "./catch-detail-client";

type Params = Promise<{ id: string }>;

export const metadata: Metadata = { title: "Catch | Fish Log Book" };

/**
 * Catch Detail (founder Historical spec §3): Calendar → Day → Catch → here.
 * The id is device data; unknown ids get an honest "no such catch", not a 404 —
 * the record may simply not be synced to this device.
 */
export default async function CatchPage({ params }: { params: Params }) {
  const { id } = await params;
  return <CatchDetailClient catchId={id} unitSystem="imperial" />;
}
