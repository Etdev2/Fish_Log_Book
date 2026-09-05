"use client";

import { useDemoMode, useTournament } from "../use-tournament";
import { CARD_PADDED, INSET, PAGE } from "../ui-classes";
import { CheckRow, DemoNote, ErrorScreen, LoadingScreen, SectionHeading, TournamentHero, TournamentTabs, BackLink } from "./tournament-chrome";

/**
 * /tournaments/[id]/rules — what you are fishing under.
 *
 * This route did not exist. The tournament nav has linked to it since the section shipped,
 * so every angler who tapped "Rules" got a 404 — which is its own answer to the question
 * "why does this feel unfinished".
 *
 * What it can honestly show today is the shape of the agreement rather than its text: which
 * of the four competition inputs are locked, what the app checks on every catch, and what
 * happens when a check is unhappy. The rule *text* lives in a versioned rule set that has
 * no publishing surface yet, and inventing a plausible-looking set of rules on a screen
 * anglers would take at face value is the one thing this page must never do.
 */

const INPUTS = [
  {
    key: "active_rule_set_version_id",
    label: "The rules",
    locked: "Locked. They cannot be edited while this tournament is being fished.",
    open: "Not written yet. The organizer sets these before the tournament can start.",
  },
  {
    key: "active_scoring_version_id",
    label: "How it is scored",
    locked: "Locked. Every catch is scored the same way, from the first to the last.",
    open: "Not chosen yet.",
  },
  {
    key: "active_verification_policy_version_id",
    label: "What counts as proof",
    locked: "Locked. The same evidence is asked of everybody.",
    open: "Not set yet.",
  },
  {
    key: "active_boundary_version_id",
    label: "Where you can fish",
    locked: "Locked. The water this tournament covers is fixed.",
    open: "Not set yet.",
  },
] as const;

export function TournamentRules({ tournamentId }: { tournamentId: string }) {
  const load = useTournament(tournamentId);
  const demoMode = useDemoMode();

  if (load.state === "loading") return <LoadingScreen label="Loading rules" />;
  if (load.state === "error") return <ErrorScreen message={load.message} />;

  const tournament = load.tournament;

  return (
    <div className={PAGE}>
      <TournamentHero
        tournament={tournament}
        // The hero repeats the tournament name directly below, so the eyebrow names the
        // destination instead of saying the same words twice.
        eyebrow={<BackLink href={`/tournaments/${tournament.id}/overview`}>Overview</BackLink>}
      />

      <TournamentTabs tournamentId={tournament.id} />

      <section className={`${CARD_PADDED} flex flex-col gap-space-4`} aria-labelledby="agreement-heading">
        <SectionHeading>
          <span id="agreement-heading">What is settled</span>
        </SectionHeading>
        <ul className="flex flex-col gap-space-3">
          {INPUTS.map((item) => {
            const locked = tournament[item.key] !== null;
            return (
              <CheckRow
                key={item.key}
                state={locked ? "done" : "pending"}
                label={item.label}
                detail={locked ? item.locked : item.open}
              />
            );
          })}
        </ul>
        <p className="text-caption text-text-muted">
          Locking these is what makes a result stand up afterwards: nothing that decides a winner can
          be changed once people are on the water.
        </p>
      </section>

      <section className={`${CARD_PADDED} flex flex-col gap-space-4`} aria-labelledby="proof-heading">
        <SectionHeading>
          <span id="proof-heading">What the app checks on a catch</span>
        </SectionHeading>
        <ul className="flex flex-col gap-space-3">
          <CheckRow state="done" label="A photo, if the event asks for one" detail="Kept as recorded. It is never edited or replaced." />
          <CheckRow state="done" label="Where and when it was caught" detail="Recorded with the catch. Never shown on a public board." />
          <CheckRow state="done" label="An event code, if the event uses them" detail="Checks it belongs to this tournament and has not already been used." />
          <CheckRow state="done" label="The measurement you entered" detail="Exactly as you typed it. The app does not round it for you." />
        </ul>

        <div className={INSET}>
          <p className="text-body-strong text-text-primary">If a check is unhappy</p>
          <p className="mt-space-2 text-body text-text-muted">
            It raises a flag for a person to look at. It never changes your score, never deletes your
            catch, and never decides you cheated. A judge makes that call, and has to write down a
            reason for it.
          </p>
        </div>
      </section>

      <section className={`${CARD_PADDED} flex flex-col gap-space-3`} aria-labelledby="board-heading">
        <SectionHeading>
          <span id="board-heading">What other people can see</span>
        </SectionHeading>
        <p className="text-body text-text-primary">
          Your name as you entered it, the fish, and the measurement.
        </p>
        <p className="text-body text-text-muted">
          Not your position, not your photos, not your phone, and not anything a judge wrote about a
          catch.
        </p>
      </section>

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}
