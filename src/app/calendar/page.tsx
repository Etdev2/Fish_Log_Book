import Link from "next/link";
import styles from "@/features/calendar/month-calendar.module.css";
import { fetchMonth, type DayMarks } from "@/features/calendar/queries";
import {
  isIsoMonth,
  monthGrid,
  monthLabel,
  shiftMonth,
  todayIso,
  type IsoMonth,
} from "@/features/calendar/month";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function noMarks(): DayMarks {
  return { hasTrip: false, hasJournal: false, unresolvedCount: 0 };
}

/** Spoken aloud by a screen reader; the dots alone are not the record. */
function describe(date: string, marks: DayMarks): string {
  const parts: string[] = [];
  if (marks.hasTrip) parts.push("has a trip");
  if (marks.hasJournal) parts.push("has a journal entry");
  if (marks.unresolvedCount > 0) {
    parts.push(
      `${marks.unresolvedCount} mark${marks.unresolvedCount === 1 ? "" : "s"} needing a look`,
    );
  }
  return parts.length > 0
    ? `${date}, ${parts.join(", ")}`
    : `${date}, nothing recorded`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = (await searchParams).month;
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const today = todayIso();
  const month: IsoMonth =
    requested && isIsoMonth(requested)
      ? requested
      : (today.slice(0, 7) as IsoMonth);

  const data = await fetchMonth(month);
  const days = data.status === "ok" ? data.days : new Map<string, DayMarks>();

  return (
    <main className={styles.calendar}>
      <div className={styles.inner}>
        {data.status === "schema-missing" ? (
          <p className={styles.notice}>
            <strong>No schema yet — showing an empty month</strong>
            The V1 migrations have not been applied to this Supabase project, so{" "}
            <code>public.{data.table}</code> does not exist. Every day below is
            blank because there is nothing to read, not because nothing was
            recorded. Run <code>scripts/phase0-apply-schema.sh</code> to close
            the gate.
          </p>
        ) : null}

        {data.status === "error" ? (
          <p className={styles.notice}>
            <strong>Could not read this month</strong>
            <code>{data.message}</code>
          </p>
        ) : null}

        <div className={styles.monthBar}>
          <Link
            className={styles.step}
            href={`/calendar?month=${shiftMonth(month, -1)}`}
            aria-label={`Previous month, ${monthLabel(shiftMonth(month, -1))}`}
          >
            ‹
          </Link>
          <h1 className={styles.monthName}>{monthLabel(month)}</h1>
          <Link
            className={styles.step}
            href={`/calendar?month=${shiftMonth(month, 1)}`}
            aria-label={`Next month, ${monthLabel(shiftMonth(month, 1))}`}
          >
            ›
          </Link>
        </div>

        <div className={styles.weekdays} aria-hidden="true">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className={styles.grid}>
          {monthGrid(month).map((cell, i) => {
            if (!cell.date)
              return <div className={styles.blank} key={`blank-${i}`} />;
            const marks = days.get(cell.date) ?? noMarks();
            const isToday = cell.date === today;
            return (
              <Link
                key={cell.date}
                href={`/day/${cell.date}`}
                className={`${styles.day} ${isToday ? styles.today : ""}`}
                aria-label={describe(cell.date, marks)}
                aria-current={isToday ? "date" : undefined}
              >
                <span className={styles.dayNumber}>{cell.day}</span>
                <span className={styles.marks} aria-hidden="true">
                  {marks.hasTrip ? <i className={styles.dotTrip} /> : null}
                  {marks.hasJournal ? (
                    <i className={styles.dotJournal} />
                  ) : null}
                  {marks.unresolvedCount > 0 ? (
                    <b className={styles.flag}>⚑</b>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </div>

        <div className={styles.legend}>
          <span>
            <i className={styles.dotTrip} /> trip
          </span>
          <span>
            <i className={styles.dotJournal} /> journal entry
          </span>
          <span>
            <b className={styles.flag}>⚑</b> needs a look
          </span>
        </div>

        <Link className={styles.todayLink} href={`/day/${today}`}>
          Go to today
        </Link>
      </div>
    </main>
  );
}
