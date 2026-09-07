"use client";

import Link from "next/link";
import { useMemo } from "react";

import { BackLink } from "@/components/back-link";

import { sortForReading, type TournamentEvent } from "../event-card";
import { tournamentPhase } from "../format";
import { useEvents } from "../queries/use-events";
import { useNow } from "../use-now";
import { CARD_PADDED, PAGE, PRIMARY_BUTTON, SECONDARY_BUTTON, TABULAR } from "../ui-classes";
import { DemoNote, EmptyState, ErrorScreen, LoadingScreen, SectionHeading } from "./tournament-chrome";
import { EventCardRow } from "./event-card-row";

/**
 * /tournaments/mine — "how many am I in, and what do I need to do about them?"
 *
 * The founder asked for a page that shows the number of tournaments you are in, and the
 * count is the point: it is the one number that tells you whether you have a busy season
 * or a free weekend, and until now it existed nowhere. The old hub had a "Your events"
 * section that mixed events you host with events you entered — two completely different
 * relationships, needing two different next actions — and counted neither.
 *
 * Split three ways, by what you do next rather than by status:
 *
 * - **On the water now** — you are fishing it; the next action is submitting a catch.
 * - **Coming up** — you are entered; the next action is being ready on the day.
 * - **Finished** — the next action, if any, is reading the result.
 *
 * Hosting is a badge on the card rather than a fourth section. An event you host and also
 * fish is one event, and giving it two rows would be the same double-listing the old hub
 * was doing.
 */
export function MyTournaments() {
  const { load, retry } = useEvents();
  const now = useNow();
  const nowMs = now === null ? 0 : Number(now);

  /* Unwrapped inside the memo — see the same note in `events-page.tsx`: a conditional
     `: []` above a memo is a new array identity on every render. */
  const mine = useMemo(() => {
    const events = load.state === "ready" ? load.events : [];
    return sortForReading(events.filter((event) => event.entered || event.hosting));
  }, [load]);

  const groups = useMemo(() => {
    const bucket = (phase: string) => mine.filter((event) => tournamentPhase(event.status) === phase);
    return { live: bucket("during"), upcoming: bucket("before"), finished: bucket("after") };
  }, [mine]);

  if (load.state === "loading") return <LoadingScreen label="Loading your tournaments" />;
  if (load.state === "error") {
    return (
      <ErrorScreen
        title="Your tournaments did not load"
        message={`${load.message} Everything else in the app still works — this is the tournament connection only.`}
        onRetry={retry}
      />
    );
  }

  const entered = mine.filter((event) => event.entered).length;
  const hosting = mine.filter((event) => event.hosting).length;

  return (
    <div className={PAGE}>
      <BackLink href="/tournaments" label="Event calendar" />

      <header className="flex flex-col gap-space-4">
        <h1 className="text-h1 text-text-primary">My tournaments</h1>

        {/*
          The count, as the headline it was asked to be. Entered and hosting are counted
          separately because they are separate commitments — running an event you are not
          fishing is still a Saturday gone.
        */}
        <div className={`${CARD_PADDED} flex flex-wrap gap-space-6`}>
          <div>
            <p className={`text-h1 text-text-primary ${TABULAR}`}>{entered}</p>
            <p className="text-caption text-text-muted">
              {entered === 1 ? "event entered" : "events entered"}
            </p>
          </div>
          <div>
            <p className={`text-h1 text-text-primary ${TABULAR}`}>{hosting}</p>
            <p className="text-caption text-text-muted">
              {hosting === 1 ? "event you host" : "events you host"}
            </p>
          </div>
        </div>
      </header>

      {mine.length === 0 ? (
        <EmptyState
          title="You are not in any tournaments yet"
          body="Events you enter or host collect here, with the ones being fished today at the top."
          action={
            <Link href="/tournaments" className={PRIMARY_BUTTON}>
              Browse events
            </Link>
          }
        />
      ) : (
        <>
          <Group heading="On the water now" events={groups.live} nowMs={nowMs} />
          <Group heading="Coming up" events={groups.upcoming} nowMs={nowMs} />
          <Group heading="Finished" events={groups.finished} nowMs={nowMs} />
          <Link href="/tournaments" className={`${SECONDARY_BUTTON} self-start`}>
            Find another event
          </Link>
        </>
      )}

      {load.demo ? <DemoNote /> : null}
    </div>
  );
}

function Group({
  heading,
  events,
  nowMs,
}: {
  heading: string;
  events: readonly TournamentEvent[];
  nowMs: number;
}) {
  // An empty group renders nothing at all. A "Finished (0)" heading is a row of furniture
  // that tells an angler something they did not ask about.
  if (events.length === 0) return null;
  return (
    <section className="flex flex-col gap-space-3">
      <SectionHeading aside={`${events.length}`}>{heading}</SectionHeading>
      <ul className="flex flex-col gap-space-3">
        {events.map((event) => (
          <li key={event.id}>
            <EventCardRow event={event} nowMs={nowMs} />
          </li>
        ))}
      </ul>
    </section>
  );
}
