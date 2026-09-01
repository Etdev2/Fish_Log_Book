import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { parseDayParam } from "@/features/calendar/calendar-data";
import { DayView } from "@/features/calendar/components/day-view";

type Params = Promise<{ date: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { date } = await params;
  const valid = parseDayParam(date);
  return { title: `${valid ?? "Day"} | Fish Log Book` };
}

/**
 * One logged day (founder requirements §7). The date is data, not wall decoration:
 * anything that is not a real `YYYY-MM-DD` calendar day 404s rather than rendering a
 * page named after garbage.
 */
export default async function DayPage({ params }: { params: Params }) {
  const { date } = await params;
  const dateKey = parseDayParam(date);
  if (!dateKey) notFound();
  return <DayView dateKey={dateKey} />;
}
