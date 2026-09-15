"use client";

import { BackLink } from "@/components/back-link";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  HOST_ROLES,
  HOST_ROLE_LABEL,
  HOST_ROLE_SUMMARY,
  hostCapabilities,
  visibleLanes,
  type HostCapabilities,
  type HostLane,
  type HostRole,
} from "@/core/tournaments/host-role";
import {
  canTransitionTournament,
  TOURNAMENT_STATUSES,
  validateTournamentTransition,
  type TournamentStatus,
} from "@/core/tournaments/lifecycle";
import { formatMoney } from "../event-card";
import { isTournamentStatus, tournamentPhase, type Phase } from "../format";
import { getDemoTournamentCatches, type DemoTournamentCatch } from "../live-catch-demo";
import { useHostRole } from "../queries/use-host-role";
import { useRoster, type RosterBoat } from "../queries/use-roster";
import { useStandings } from "../queries/use-standings";
import { useTournamentMoney, type TournamentMoney } from "../queries/use-tournament-money";
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

const LANE_LABEL: Readonly<Record<HostLane, string>> = {
  event: "Event",
  roster: "Who's entered",
  judging: "Judging",
  money: "Money",
  team: "Access",
};

const PHASE_HEADING: Readonly<Record<Phase, string>> = {
  before: "Set the event up and get the field ready.",
  during: "Keep the event moving while anglers are on the water.",
  after: "Settle judging, publish the result, and close out the event.",
};

const HOST_FLOW: ReadonlyArray<{
  phase: Phase;
  number: string;
  title: string;
  detail: string;
}> = [
  { phase: "before", number: "1", title: "Set up", detail: "Entries, rules, scoring, proof, and boundaries." },
  { phase: "during", number: "2", title: "Run", detail: "Live event status, catches, pauses, and judging." },
  { phase: "after", number: "3", title: "Settle", detail: "Reviews, final standings, and payouts." },
];

/**
 * The host screen, and who is allowed to see which half of it.
 *
 * Before this, the page rendered "Host controls", a judging queue and a money panel to
 * anybody who typed the URL. Row-level security kept the *data* empty for a stranger, so
 * nothing leaked — what leaked was the impression of being the host, on a screen with a
 * "Cancel the tournament" button on it. The role is fetched first now, and a person who
 * holds none is sent to the public page with a plain sentence rather than a locked room.
 *
 * The lanes come from `visibleLanes`, so a treasurer never sees an empty judging queue and
 * event staff never see the takings. That table is checked against the database's own
 * policies by `host-role.sql.test.ts` — the screen and the server have to agree, and a
 * disagreement is a test failure rather than a support call.
 */
export function TournamentOperations({
  tournamentId,
  initialPanel,
}: {
  tournamentId: string;
  initialPanel?: HostLane;
}) {
  const load = useTournament(tournamentId);
  const demoMode = useDemoMode();
  const roleLoad = useHostRole(tournamentId);
  const standingsLoad = useStandings(tournamentId);
  const standings = standingsLoad.state === "ready" ? standingsLoad.rows : [];

  /*
    Demo mode only: look at the screen as each role, so the separation can be checked
    without four accounts and a club. It is never offered against a real database, where
    the role is whatever the server says it is and pretending otherwise would show somebody
    a lane whose first query is going to be refused.
  */
  const [previewRole, setPreviewRole] = useState<HostRole | null>(null);
  const role = demoMode && previewRole !== null ? previewRole : roleLoad.state === "ready" ? roleLoad.role : null;
  const caps = hostCapabilities(role);
  const lanes = useMemo(() => visibleLanes(caps), [caps]);

  const [lane, setLane] = useState<HostLane | null>(initialPanel ?? null);
  // The lane actually rendered: the chosen one while it is still allowed, otherwise the
  // first this role may open. A treasurer who was on "Judging" as an admin lands on
  // "Event", not on a blank panel.
  const activeLane = lane !== null && lanes.includes(lane) ? lane : (lanes[0] ?? null);

  const [catches, setCatches] = useState<readonly DemoTournamentCatch[]>([]);

  const rosterLoad = useRoster(tournamentId, caps.readRoster);
  const moneyLoad = useTournamentMoney(tournamentId, caps.readMoney);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setCatches(caps.judge ? getDemoTournamentCatches(tournamentId) : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [demoMode, tournamentId, caps.judge]);

  const flagged = useMemo(() => catches.filter((item) => item.fair_play_messages.length > 0), [catches]);

  if (load.state === "loading" || roleLoad.state === "loading") {
    return <LoadingScreen label="Loading organizer tools" />;
  }
  if (load.state === "error") return <ErrorScreen message={load.message} />;
  if (roleLoad.state === "error") return <ErrorScreen message={roleLoad.message} />;

  const tournament = load.tournament;
  if (role === null) return <NotYours tournamentId={tournament.id} />;

  const phase = tournamentPhase(tournament.status);

  return (
    <div className={PAGE}>
      <header className="flex flex-col gap-space-3">
        <BackLink href={`/tournaments/${tournament.id}/overview`} label="Tournament home" />
        <div className="flex flex-col gap-space-1">
          <span className="text-label text-signal-orange">Host controls</span>
          <div className="flex flex-wrap items-end justify-between gap-space-3">
            <h1 className="text-h1 text-text-primary">Run the tournament</h1>
            <StatusPill status={tournament.status} />
          </div>
        </div>
        <p className="text-body text-text-muted">{PHASE_HEADING[phase]}</p>
      </header>

      <YourAccess role={role} />

      {demoMode ? <RolePreview selected={previewRole} onSelect={setPreviewRole} /> : null}

      {caps.changeEventSettings ? <HostLifecycle activePhase={phase} /> : null}

      <nav aria-label="Host work areas" className="flex flex-col gap-space-2">
        <span className="text-label text-text-primary">Host work areas</span>
        <ul className="flex flex-wrap gap-space-2">
          {lanes.map((item) => (
            <li key={item}>
              <button
                type="button"
                aria-pressed={activeLane === item}
                onClick={() => setLane(item)}
                className={`${CHIP} ${activeLane === item ? CHIP_ON : CHIP_OFF}`}
              >
                {LANE_LABEL[item]}
              </button>
            </li>
          ))}
        </ul>
        <p className="text-caption text-text-muted">
          Event operations, judging decisions, and money stay separate so one permission never silently grants another.
        </p>
      </nav>

      {activeLane === "event" ? (
        <OrganizerLane
          tournament={tournament}
          phase={phase}
          caps={caps}
          catches={catches.length}
          flagged={flagged.length}
          standings={standings.length}
        />
      ) : null}
      {activeLane === "roster" ? <RosterLane load={rosterLoad} /> : null}
      {activeLane === "judging" ? <JudgeLane flagged={flagged} /> : null}
      {activeLane === "money" ? <FinanceLane load={moneyLoad} caps={caps} /> : null}
      {activeLane === "team" ? <AccessLane /> : null}

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}

/**
 * What somebody who is not on the host team sees.
 *
 * Deliberately not an error and deliberately not a lock screen: most people who land here
 * followed a link or kept an old bookmark, and the useful thing to hand them is the way
 * back to the event itself.
 */
function NotYours({ tournamentId }: { tournamentId: string }) {
  return (
    <div className={PAGE}>
      <BackLink href={`/tournaments/${tournamentId}/overview`} label="Tournament home" />
      <EmptyState
        title="You don't run this tournament"
        body="These are the host's controls — setting the rules, judging catches, and handling the entry money. If you are entered in this event, everything you need is on the tournament's own pages."
        action={
          <div className="flex flex-wrap gap-space-2">
            <Link href={`/tournaments/${tournamentId}/overview`} className={SECONDARY_BUTTON}>
              Go to the tournament
            </Link>
            <Link href="/tournaments/mine" className={SECONDARY_BUTTON}>
              My tournaments
            </Link>
          </div>
        }
      />
      <p className="text-caption text-text-muted">
        If you should have access, the person who set the event up can add you to the host team.
      </p>
    </div>
  );
}

function YourAccess({ role }: { role: HostRole }) {
  return (
    <section className={`${INSET} flex flex-col gap-space-1`} aria-label="Your access">
      <div className="flex flex-wrap items-center gap-space-2">
        <span className="text-caption text-text-muted">Your access</span>
        <TonePill tone="open">{HOST_ROLE_LABEL[role]}</TonePill>
      </div>
      <p className="text-caption text-text-muted">{HOST_ROLE_SUMMARY[role]}</p>
    </section>
  );
}

function RolePreview({
  selected,
  onSelect,
}: {
  selected: HostRole | null;
  onSelect: (role: HostRole | null) => void;
}) {
  return (
    <section className={`${CARD_PADDED} flex flex-col gap-space-2`} aria-label="Preview another role">
      <SectionHeading>See it as somebody else</SectionHeading>
      <p className="text-caption text-text-muted">
        Demo only. Switches which lanes this screen offers, so the separation between running the
        event and handling the money can be checked without four accounts. Against a real database
        the role is whatever the server says it is.
      </p>
      <ul className="flex flex-wrap gap-space-2">
        <li>
          <button
            type="button"
            aria-pressed={selected === null}
            onClick={() => onSelect(null)}
            className={`${CHIP} ${selected === null ? CHIP_ON : CHIP_OFF}`}
          >
            Me
          </button>
        </li>
        {HOST_ROLES.map((role) => (
          <li key={role}>
            <button
              type="button"
              aria-pressed={selected === role}
              onClick={() => onSelect(role)}
              className={`${CHIP} ${selected === role ? CHIP_ON : CHIP_OFF}`}
            >
              {HOST_ROLE_LABEL[role]}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HostLifecycle({ activePhase }: { activePhase: Phase }) {
  const activeIndex = HOST_FLOW.findIndex((item) => item.phase === activePhase);

  return (
    <section className={`${CARD_PADDED} flex flex-col gap-space-3`} aria-labelledby="host-flow-heading">
      <SectionHeading>
        <span id="host-flow-heading">Host flow</span>
      </SectionHeading>
      <ol className="grid gap-space-3 sm:grid-cols-3">
        {HOST_FLOW.map((item, index) => {
          const active = item.phase === activePhase;
          const complete = index < activeIndex;
          return (
            <li
              key={item.phase}
              className={`flex items-start gap-space-3 rounded-lg border p-space-3 ${
                active ? "border-signal-orange bg-signal-orange/10" : "border-hairline bg-surface"
              }`}
            >
              <span
                className={`flex h-space-8 w-space-8 shrink-0 items-center justify-center rounded-full border text-caption ${
                  active
                    ? "border-signal-orange text-signal-orange"
                    : complete
                      ? "border-success-green text-success-green"
                      : "border-border-interactive text-text-muted"
                }`}
              >
                {item.number}
              </span>
              <span className="flex flex-col gap-space-1">
                <span className={`text-body-strong ${active ? "text-signal-orange" : "text-text-primary"}`}>{item.title}</span>
                <span className="text-caption text-text-muted">{item.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const READINESS = [
  ["active_rule_set_version_id", "Rules"],
  ["active_scoring_version_id", "Scoring"],
  ["active_verification_policy_version_id", "What counts as proof"],
  ["active_boundary_version_id", "Where you can fish"],
] as const;

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

const HIGH_RISK: ReadonlySet<TournamentStatus> = new Set(["LIVE", "FINAL", "CANCELLED"]);

function OrganizerLane({
  tournament,
  phase,
  caps,
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
  caps: HostCapabilities;
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

  const moves = from
    ? TOURNAMENT_STATUSES.filter((to) => canTransitionTournament(from, to)).map((to) => ({
        to,
        result: validateTournamentTransition({ from, to, versions }),
      }))
    : [];

  return (
    <div className="flex flex-col gap-space-5">
      <section className="grid grid-cols-2 gap-space-3 sm:grid-cols-3" aria-label="Event at a glance">
        <StatTile label="Catches logged" value={String(catches)} />
        {caps.judge ? (
          <StatTile label="For a judge" value={String(flagged)} tone={flagged > 0 ? "attention" : "neutral"} />
        ) : null}
        <StatTile label="On the board" value={String(standings)} />
      </section>

      {phase === "before" && caps.changeEventSettings ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-3`}>
          <SectionHeading aside={`${READINESS.filter(([key]) => tournament[key] !== null).length} of 4`}>
            Ready for lines in
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

      {caps.changeEventSettings ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-3`}>
          <SectionHeading>What happens next</SectionHeading>
          {moves.length === 0 ? (
            <p className="text-body text-text-muted">This tournament is finished. Nothing moves from here.</p>
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
            the server&apos;s decision, not the phone&apos;s, and that half is not switched on in this build yet.
          </p>
        </section>
      ) : (
        <p className={`${INSET} inline-flex items-start gap-space-2 text-caption text-text-muted`}>
          <LockIcon size="h-space-4 w-space-4" />
          Moving the tournament between states, and changing the rules, scoring and boundaries, is the
          owner&apos;s and administrators&apos; to do.
        </p>
      )}

      <Link href={`/tournaments/${tournament.id}/leaderboard`} className={SECONDARY_BUTTON}>
        Open public Results
      </Link>
    </div>
  );
}

/**
 * The dock list. Boats with something outstanding first, and a phone number that dials.
 *
 * `tel:` rather than a printed number on purpose: this screen gets used at 4am when
 * weather cancels the event, one-handed, and retyping ten digits off a phone screen into
 * the same phone is the moment a host gives up and uses a spreadsheet instead.
 */
function RosterLane({ load }: { load: ReturnType<typeof useRoster> }) {
  if (load.state === "loading") return <p className="text-body text-text-muted">Loading the field…</p>;
  if (load.state === "error") {
    return (
      <EmptyState
        title="The field could not be loaded"
        body={load.message}
      />
    );
  }

  const boats = load.boats;
  const anglers = boats.reduce((total, boat) => total + boat.crew.length, 0);
  const waiting = boats.filter((boat) => !boat.confirmed).length;

  return (
    <div className="flex flex-col gap-space-4">
      <section className="grid grid-cols-2 gap-space-3 sm:grid-cols-3" aria-label="The field">
        <StatTile label="Boats" value={String(boats.length)} />
        <StatTile label="Anglers" value={String(anglers)} />
        <StatTile label="Not confirmed" value={String(waiting)} tone={waiting > 0 ? "attention" : "neutral"} />
      </section>

      {boats.length === 0 ? (
        <EmptyState
          title="Nobody has entered yet"
          body="Boats appear here as they register. Each one shows its crew, who the captain is, and a number that will be answered on the day."
        />
      ) : (
        <ul className="flex flex-col gap-space-3">
          {boats.map((boat) => (
            <BoatCard key={boat.id} boat={boat} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BoatCard({ boat }: { boat: RosterBoat }) {
  return (
    <li className={`${CARD} flex flex-col gap-space-3 p-space-4`}>
      <div className="flex flex-wrap items-start justify-between gap-space-3">
        <p className="text-body-strong text-text-primary">{boat.name}</p>
        <TonePill tone={boat.confirmed ? "open" : "attention"}>
          {boat.confirmed ? "Confirmed" : "Not confirmed"}
        </TonePill>
      </div>
      <ul className="flex flex-col gap-space-2">
        {boat.crew.map((angler) => (
          <li key={angler.id} className="flex flex-wrap items-baseline justify-between gap-space-2">
            <span className="text-body text-text-primary">
              {angler.displayName}
              {angler.captain ? <span className="text-caption text-text-muted"> · Captain</span> : null}
            </span>
            {angler.phone !== null ? (
              <a href={`tel:${angler.phone}`} className={`text-caption ${TABULAR} text-text-link underline`}>
                {angler.phone}
              </a>
            ) : (
              <span className="text-caption text-text-muted">No number</span>
            )}
          </li>
        ))}
      </ul>
      {!boat.confirmed ? (
        <p className="text-caption text-text-muted">
          Confirmed when the entry fee is settled. A boat stays here until the payment clears.
        </p>
      ) : null}
    </li>
  );
}

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

/**
 * The takings, read from the ledger.
 *
 * This panel used to print "Nothing has been taken and nothing is owed" as a constant. The
 * moment a real entry fee landed that sentence became a lie nobody would have caught,
 * because it looks exactly like a quiet tournament. It reads `tournament_order` now, and
 * when it cannot, it says so instead of showing a zero.
 */
function FinanceLane({
  load,
  caps,
}: {
  load: ReturnType<typeof useTournamentMoney>;
  caps: HostCapabilities;
}) {
  return (
    <div className="flex flex-col gap-space-4">
      <section className={`${CARD_PADDED} flex flex-col gap-space-3`}>
        <SectionHeading>Entry money</SectionHeading>
        {load.state === "loading" ? (
          <p className="text-body text-text-muted">Reading the ledger…</p>
        ) : load.state === "error" ? (
          <p className="inline-flex items-start gap-space-2 text-body text-amber-flag">
            <AlertIcon size="h-space-4 w-space-4" />
            The takings could not be read, so nothing is shown rather than a zero. {load.message}
          </p>
        ) : (
          <MoneyFigures money={load.money} />
        )}
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
            detail="Being the organizer, or the judge, is not enough on its own — event staff cannot read this screen at all."
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
          {caps.approvePayout
            ? "Your role can approve a payout. There is nothing to approve, and payouts are not switched on in this build."
            : "Your role cannot approve a payout."}
        </p>
      </section>
    </div>
  );
}

function MoneyFigures({ money }: { money: TournamentMoney }) {
  // No orders at all is a real state, and it is not the same as a zero total. Saying
  // "nothing yet" beats printing $0.00, which reads as a tournament whose entries failed.
  if (money.paidOrders === 0 && money.unpaidOrders === 0) {
    return (
      <p className="text-body text-text-primary">
        Nothing has been taken yet. Entry fees appear here as they are paid.
      </p>
    );
  }

  const currency = money.currency ?? "USD";

  return (
    <>
      <div className="grid grid-cols-2 gap-space-3">
        <StatTile label="Collected" value={formatMoney(money.collectedMinor, currency) ?? "—"} />
        <StatTile
          label="Still owed"
          value={formatMoney(money.outstandingMinor, currency) ?? "—"}
          tone={money.outstandingMinor > 0 ? "attention" : "neutral"}
        />
      </div>
      <p className={`text-caption ${TABULAR} text-text-muted`}>
        {money.paidOrders} paid · {money.unpaidOrders} waiting
        {money.refundedOrders > 0 ? ` · ${money.refundedOrders} refunded` : ""}
      </p>
      {money.unpaidOrders > 0 ? (
        <p className="text-caption text-text-muted">
          Waiting means a checkout was started and the payment has not been confirmed. Those boats stay
          off the confirmed field until it is.
        </p>
      ) : null}
    </>
  );
}

/**
 * What each role on the host team can do — the same table the screen itself is driven by.
 *
 * Read-only, and says so. Inviting somebody is a server-side act with an email and a token
 * behind it, and none of that half is built; a button that appeared to add an administrator
 * and did nothing would be worse than no button.
 */
function AccessLane() {
  return (
    <div className="flex flex-col gap-space-4">
      <section className="flex flex-col gap-space-3">
        <SectionHeading>Who can do what</SectionHeading>
        <ul className="flex flex-col gap-space-3">
          {HOST_ROLES.map((role) => {
            const caps = hostCapabilities(role);
            const can = visibleLanes(caps)
              .filter((entry) => entry !== "event")
              .map((entry) => LANE_LABEL[entry]);
            return (
              <li key={role} className={`${CARD} flex flex-col gap-space-1 p-space-4`}>
                <p className="text-body-strong text-text-primary">{HOST_ROLE_LABEL[role]}</p>
                <p className="text-caption text-text-muted">{HOST_ROLE_SUMMARY[role]}</p>
                <p className="text-caption text-text-muted">
                  {can.length > 0 ? `Opens: ${can.join(", ")}.` : "Opens the event screen only."}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <p className={`${INSET} inline-flex items-start gap-space-2 text-caption text-text-muted`}>
        <LockIcon size="h-space-4 w-space-4" />
        Adding somebody to the host team is not switched on in this build. It needs an invitation with
        an email and an expiring token behind it, and a button here that appeared to grant an
        administrator without doing so would be worse than no button at all.
      </p>
    </div>
  );
}
