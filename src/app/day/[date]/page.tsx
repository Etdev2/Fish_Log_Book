import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/features/calendar/month-calendar.module.css";
import { todayIso } from "@/features/calendar/month";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!ISO_DATE.test(date)) notFound();

  const today = todayIso();
  const isToday = date === today;
  const isFuture = date > today;

  return (
    <main className={styles.calendar}>
      <div className={styles.inner}>
        <div className={styles.monthBar}>
          <Link
            className={styles.step}
            href={`/calendar?month=${date.slice(0, 7)}`}
            aria-label="Back to calendar"
          >
            ‹
          </Link>
          <h1 className={styles.monthName}>{isToday ? "Today" : date}</h1>
          <span className={styles.spacer} aria-hidden="true" />
        </div>

        <p className={styles.notice}>
          <strong>Day page not built yet</strong>
          {isFuture
            ? "This day has not happened. Nothing can be recorded against it."
            : isToday
              ? "This is where Start Fishing, the four verbs and the one-tap mark will live."
              : "This is where a past day opens in read/write history mode, with every backfilled row flagged as after-the-fact."}{" "}
          The calendar reaches it; the surface itself is the next Phase 1
          deliverable.
        </p>
      </div>
    </main>
  );
}
