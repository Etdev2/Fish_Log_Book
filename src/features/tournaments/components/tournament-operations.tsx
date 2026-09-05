"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  canTransitionTournament,
  TOURNAMENT_STATUSES,
  validateTournamentTransition,
  type TournamentStatus,
} from "@/core/tournaments/lifecycle";
import { getDemoStandings, type DemoStanding } from "../demo-store";
import { isTournamentStatus, tournamentPhase, type Phase } from "../format";
import { getDemoTournamentCatches, type DemoTournamentCatch } from "../live-catch-demo";
import { useDemoMode, useTournament } from "../use-tournament";
import {
  CARD,
  CARD_PADDED,
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  INSET,
  PAGE,
  SECONDARY_BUTTON,
  TABULAR,
} from "../ui-classes";
import { AlertIcon, LockIcon } from "./icons";
import {
  BackLink,
  CheckRow,
  DemoNote,
  EmptyState,
  ErrorScreen,
  LoadingScreen,
  SectionHeading,
  StatTile,
  StatusPill,
  TonePill,
} from "./tournament-chrome";

/**
 * /tournaments/[id]/operations — running the event.
 *
 * Three lanes, because the domain model keeps them apart and the UI must not be the place
 * that quietly rejoins them: the person who runs the event, the person who judges a catch,
 * and the person who is allowed to move money are three different authorities even when
 * they happen to be the same human on a Saturday.
 *
 * What changed from the first version, beyond the styling: the lifecycle controls are no
 * longer two hardcoded disabled buttons labelled "Close registration" and "Start
 * tournament". They are computed from `core/tournaments/lifecycle.ts` — the same transition
 * table the server enforces — so this screen shows the moves that are actually legal from
 * where the tournament is, and, when LIVE is refused, says which of the four frozen inputs
 * is missing. The judge queue is built from real catches carrying real Fair Play flags
 * rather than one invented "Yellowtail · evidence review" card, and the finance panel no
 * longer displays $1,250 of money nobody took.
 */

type Lane = "organizer" | "judge" | "finance";

const LANES: Array<{ value: Lane; label: string }> = [
  { value: "organizer", label: "Organizer" },
  { value: "judge", label: "Judging" },
  { value: "finance", label: "Money" },
];

const PHASE_HEADING: Readonly<Record<Phase, string>> = {
  before: "Before the event",
  during: "While it is being fished",
  after: "After lines out",
};

export function TournamentOperations({
  tournamentId,
  initialPanel = "organizer",
}: {
  tournamentId: string;
  initialPanel?: Lane;
}) {
  const load = useTournament(tournamentId);
  const demoMode = useDemoMode();
  const [lane, setLane] = useState<Lane>(initialPanel);
  const [catches, setCatches] = useState<readonly DemoTournamentCatch[]>([]);
  const [standings, setStandings] = useState<readonly DemoStanding[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setCatches(getDemoTournamentCatches(tournamentId));
      setStandings(demoMode ? getDemoStandings(tournamentId) : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [demoMode, tournamentId]);

  const flagged = useMemo(() => catches.filter((item) => item.fair_play_messages.length > 0), [catches]);

  if (load.state === "loading") return <LoadingScreen label="Loading organizer tools" />;
  if (load.state === "error") return <ErrorScreen message={load.message} />;

  const tournament = load.tournament;
  const phase = tournamentPhase(tournament.status);

  return (
    <div className={PAGE}>
      <header className="flex flex-col gap-space-3">
        <BackLink href={`/tournaments/${tournament.id}/overview`}>{tournament.name}</BackLink>
        <div className="flex flex-wrap items-end justify-between gap-space-3">
          <h1 className="text-h1 text-text-primary">Run the event</h1>
          <StatusPill status={tournament.status} />
        </div>
        <p className="text-body text-text-muted">
          {PHASE_HEADING[phase]}. Judging, the public board, and anything to do with money each sit
          behind their own permission — nobody gets all three by accident.
        </p>
      </header>

      <nav aria-label="Organizer tools" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-space-2 pb-1">
          {LANES.map((item) => (
            <li key={item.value}>
              <button
                type="button"
                aria-pressed={lane === item.value}
                onClick={() => setLane(item.value)}
                className={`${CHIP} ${lane === item.value ? CHIP_ON : CHIP_OFF}`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {lane === "organizer" ? (
        <OrganizerLane tournament={tournament} phase={phase} catches={catches.length} flagged={flagged.length} standings={standings.length} />
      ) : null}
      {lane === "judge" ? <JudgeLane flagged={flagged} /> : null}
      {lane === "finance" ? <FinanceLane /> : null}

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Organizer                                                                   */
/* -------------------------------------------------------------------------- */

const READINESS = [
  ["active_rule_set_version_id", "Rules"],
  ["active_scoring_version_id", "Scoring"],
  ["active_verification_policy_version_id", "What counts as proof"],
  ["active_boundary_version_id", "Where you can fish"],
] as const;

/** What a director would call each transition, rather than the enum it moves to. */
const TRANSITION_LABEL: Readonly<Record<TournamentStatus, string>> = {
  DRAFT: "Back to draft",
  REGISTRATION_OPEN: "Open entries",
  REGISTRATION_CLOSED: "Close entries",
  READY: "Mark ready",
  LIVE: "Start fishing",
  PAUSED: "Pause",
  COMPLETED: "Lines out",
  RESULTS_PENDING: "Start settling results",
  FINAL: "Make it official",
  CANCELLED: "Cancel the tournament",
};

/**
 * High-risk moves, per UX-001 §6 — the ones that need a confirmation and an explanation of
 * consequences before they fire. They are marked here so that whoever wires these controls
 * to the server cannot miss which three they are.
 */
const HIGH_RISK: ReadonlySet<TournamentStatus> = new Set(["LIVE", "FINAL", "CANCELLED"]);

function OrganizerLane({
  tournament,
  phase,
  catches,
  flagged,
  standings,
}: {
  tournament: {
    readonly status: string;
    readonly id: string;
    readonly active_rule_set_version_id: string | null;
    readonly active_scoring_version_id: string | null;
    readonly active_verification_policy_version_id: string | null;
    readonly active_boundary_version_id: string | null;
  };
  phase: Phase;
  catches: number;
  flagged: number;
  standings: number;
}) {
  const versions = {
    ruleSetVersionId: tournament.active_rule_set_version_id,
    scoringVersionId: tournament.active_scoring_version_id,
    verificationPolicyVersionId: tournament.active_verification_policy_version_id,
    boundaryVersionId: tournament.active_boundary_version_id,
  };

  const from = isTournamentStatus(tournament.status) ? tournament.status : null;

  // Every state the transition table allows from here, each carrying the server's own
  // reason when it would be refused. Computing it from `core/` rather than hardcoding a
  // pair of buttons means this screen cannot drift from the rules the server enforces.
  const moves = from
    ? TOURNAMENT_STATUSES.filter((to) => canTransitionTournament(from, to)).map((to) => ({
        to,
        result: validateTournamentTransition({ from, to, versions }),
      }))
    : [];

  return (
    <div className="flex flex-col gap-space-5">
      {/*
        Two across on a phone rather than one. Three full-width cards each holding a single
        digit is a lot of scrolling to learn three numbers.
      */}
      <section className="grid grid-cols-2 gap-space-3 sm:grid-cols-3" aria-label="Event at a glance">
        <StatTile label="Catches logged" value={String(catches)} />
        <StatTile label="For a judge" value={String(flagged)} tone={flagged > 0 ? "attention" : "neutral"} />
        <StatTile label="On the board" value={String(standings)} />
      </section>

      {phase === "before" ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-3`}>
          <SectionHeading aside={`${READINESS.filter(([key]) => tournament[key] !== null).length} of 4`}>
            Locked before fishing starts
          </SectionHeading>
          <ul className="flex flex-col gap-space-3">
            {READINESS.map(([key, label]) => (
              <CheckRow
                key={key}
                state={tournament[key] !== null ? "done" : "pending"}
                label={label}
                detail={tournament[key] !== null ? "Locked." : "Still to set."}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section className={`${CARD_PADDED} flex flex-col gap-space-3`}>
        <SectionHeading>What you can do next</SectionHeading>
        {moves.length === 0 ? (
          <p className="text-body text-text-muted">
            This tournament is finished. Nothing moves from here.
          </p>
        ) : (
          <ul className="flex flex-col gap-space-3">
            {moves.map(({ to, result }) => (
              <li key={to} className="flex flex-col gap-space-2">
                <button type="button" className={SECONDARY_BUTTON} disabled>
                  {TRANSITION_LABEL[to]}
                </button>
                <p className="text-caption text-text-muted">
                  {!result.ok ? (
                    <span className="inline-flex items-start gap-space-2 text-amber-flag">
                      <AlertIcon size="h-space-4 w-space-4" />
                      Not yet — the rules, scoring, proof and boundaries all have to be locked first.
                    </span>
                  ) : HIGH_RISK.has(to) ? (
                    "This one will ask you to confirm, and tell you what it changes, before it does anything."
                  ) : (
                    "Moves the whole tournament to this state for everybody."
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="inline-flex items-start gap-space-2 border-t border-hairline pt-space-3 text-caption text-text-muted">
          <LockIcon size="h-space-4 w-space-4" />
          These controls are shown, and disabled, on purpose. Moving a tournament between states is
          the server&apos;s decision, not the phone&apos;s, and that half is not switched on in this
          build yet.
        </p>
      </section>

      <Link href={`/tournaments/${tournament.id}/leaderboard`} className={SECONDARY_BUTTON}>
        Open the public board
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Judging                                                                     */
/* -------------------------------------------------------------------------- */

function JudgeLane({ flagged }: { flagged: readonly DemoTournamentCatch[] }) {
  return (
    <div className="flex flex-col gap-space-4">
      <section className="flex flex-col gap-space-3">
        <SectionHeading aside={flagged.length > 0 ? `${flagged.length} waiting` : undefined}>
          Review queue
        </SectionHeading>

        {flagged.length === 0 ? (
          <EmptyState
            title="Nothing needs a decision"
            body="Catches land here when something about them needs a person — a missing photo, a code that had already been used, no position recorded."
          />
        ) : (
          <ul className="flex flex-col gap-space-3">
            {flagged.map((item) => (
              <li key={item.id} className={`${CARD} flex flex-col gap-space-3 p-space-4`}>
                <div className="flex flex-wrap items-start justify-between gap-space-3">
                  <div className="flex flex-col gap-space-1">
                    <p className="text-body-strong text-text-primary">{item.species}</p>
                    <p className={`text-caption ${TABULAR} text-text-muted`}>
                      {item.weight_lb !== null ? `${item.weight_lb} lb` : "No weight"} ·{" "}
                      {new Date(item.captured_at).toLocaleString()}
                    </p>
                  </div>
                  <TonePill tone="attention">Needs a decision</TonePill>
                </div>

                <ul className="flex list-disc flex-col gap-space-1 pl-space-4 text-caption text-text-muted">
                  {item.fair_play_messages.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>

                <div className="grid grid-cols-2 gap-space-2">
                  <button type="button" className={SECONDARY_BUTTON} disabled>
                    See the evidence
                  </button>
                  <button type="button" className={SECONDARY_BUTTON} disabled>
                    Record a decision
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className={`${INSET} text-caption text-text-muted`}>
        A judge can approve, reject, penalise, reverse an earlier call, or settle a dispute, and every
        one of those needs a reason written down. Nothing on this screen can touch money — that is a
        different permission held by a different person.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Money                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The finance lane shows no numbers.
 *
 * The first version displayed "$1,250" of entry receipts and a "$1,000" prize pool on every
 * tournament, which were invented. Money is the one place in this product where a
 * placeholder is not a harmless mock — an organizer who reads a payout figure off a screen
 * and repeats it at a weigh-in has been misled by us. Until there is a real ledger to read,
 * this lane explains the guarantee it enforces and offers nothing to press.
 */
function FinanceLane() {
  return (
    <div className="flex flex-col gap-space-4">
      <section className={`${CARD_PADDED} flex flex-col gap-space-3`}>
        <SectionHeading>Entry money and payouts</SectionHeading>
        <p className="text-body text-text-primary">
          Nothing has been taken and nothing is owed. Payments are not switched on for this
          tournament.
        </p>
        <p className="text-caption text-text-muted">
          When they are, this is where entry receipts and the prize pool are read from the ledger —
          never estimated on the phone.
        </p>
      </section>

      <section className={`${CARD_PADDED} flex flex-col gap-space-3`}>
        <SectionHeading>The rule that does not bend</SectionHeading>
        <ul className="flex flex-col gap-space-3">
          <CheckRow
            state="done"
            label="Working out the result never moves money"
            detail="Final standings can produce a payout instruction. Carrying it out is a separate, deliberate act."
          />
          <CheckRow
            state="done"
            label="A person with money permission has to approve it"
            detail="Being the organizer, or the judge, is not enough on its own."
          />
          <CheckRow
            state="done"
            label="Card details and wallet keys never reach this screen"
            detail="The app shows what was paid and to whom, not the means of paying."
          />
        </ul>
        <button type="button" className={SECONDARY_BUTTON} disabled>
          Approve a payout
        </button>
        <p className="text-caption text-text-muted">
          There is nothing to approve, and payouts are not switched on in this build.
        </p>
      </section>
    </div>
  );
}
