"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { getDemoTournament, hasSupabaseBrowserConfig } from "../demo-store";
import { getDemoTournamentCatches } from "../live-catch-demo";
import { TOURNAMENT_CARD, TOURNAMENT_PRIMARY_BUTTON, TOURNAMENT_SECONDARY_BUTTON } from "../ui-classes";

type Panel = "organizer" | "judge" | "leaderboard" | "finance";

type Standing = {
  rank: number;
  angler: string;
  fish: string;
  weightLb: number;
  status: "official" | "pending";
};

const PANELS: Array<{ value: Panel; label: string }> = [
  { value: "organizer", label: "Organizer" },
  { value: "judge", label: "Judge" },
  { value: "leaderboard", label: "Leaderboard" },
  { value: "finance", label: "Finance" },
];

const DEMO_STANDINGS: Standing[] = [
  { rank: 1, angler: "M. Rivera", fish: "Yellowtail", weightLb: 28.6, status: "official" },
  { rank: 2, angler: "J. Park", fish: "Yellowtail", weightLb: 24.2, status: "official" },
  { rank: 3, angler: "A. Lewis", fish: "Yellowtail", weightLb: 21.9, status: "pending" },
];

export function TournamentOperations({ tournamentId, initialPanel = "organizer" }: { tournamentId: string; initialPanel?: Panel }) {
  const [panel, setPanel] = useState<Panel>(initialPanel);
  const demoMode = !hasSupabaseBrowserConfig();
  const tournament = demoMode ? getDemoTournament(tournamentId) : null;
  const catches = useMemo(() => (demoMode ? getDemoTournamentCatches(tournamentId) : []), [demoMode, tournamentId]);

  if (demoMode && !tournament) {
    return (
      <div className="mx-auto flex max-w-reading flex-col gap-space-4 px-space-4 py-space-5">
        <p className={`${TOURNAMENT_CARD} text-body text-error-red`}>Tournament not found on this device.</p>
        <Link href="/tournaments" className={TOURNAMENT_SECONDARY_BUTTON}>Back to tournaments</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-5 px-space-4 py-space-5">
      <header className="flex flex-col gap-space-2">
        <Link href={`/tournaments/${tournamentId}/overview`} className="text-caption text-text-link">← Overview</Link>
        <div className="flex flex-wrap items-start justify-between gap-space-3">
          <div>
            <h1 className="text-h1 text-text-primary">Tournament operations</h1>
            <p className="text-body text-text-muted">Run the event without mixing judging, public standings, and money permissions.</p>
          </div>
          {demoMode ? <span className="rounded-full border border-hairline px-space-3 py-space-1 text-caption text-text-muted">Demo mode</span> : null}
        </div>
      </header>

      <nav aria-label="Operations roles" className="overflow-x-auto">
        <ul className="flex min-w-max gap-space-2 pb-space-1">
          {PANELS.map((item) => (
            <li key={item.value}>
              <button type="button" aria-pressed={panel === item.value} onClick={() => setPanel(item.value)} className={panel === item.value ? TOURNAMENT_PRIMARY_BUTTON : TOURNAMENT_SECONDARY_BUTTON}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {panel === "organizer" ? <OrganizerPanel catches={catches.length} /> : null}
      {panel === "judge" ? <JudgePanel catches={catches.length} /> : null}
      {panel === "leaderboard" ? <LeaderboardPanel /> : null}
      {panel === "finance" ? <FinancePanel /> : null}
    </div>
  );
}

function OrganizerPanel({ catches }: { catches: number }) {
  return (
    <div className="flex flex-col gap-space-4">
      <section className="grid gap-space-3 sm:grid-cols-3" aria-label="Tournament operations summary">
        <Metric label="Lifecycle" value="Registration open" />
        <Metric label="Caught on device" value={String(catches)} />
        <Metric label="Review queue" value={catches > 0 ? String(Math.min(catches, 2)) : "0"} />
      </section>
      <section className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`}>
        <h2 className="text-h3 text-text-primary">Director controls</h2>
        <p className="text-body text-text-muted">Lifecycle transitions remain server-authoritative. LIVE requires frozen rules, scoring, verification policy, and boundaries.</p>
        <div className="grid grid-cols-2 gap-space-2">
          <button type="button" className={TOURNAMENT_SECONDARY_BUTTON} disabled>Close registration</button>
          <button type="button" className={TOURNAMENT_SECONDARY_BUTTON} disabled>Start tournament</button>
        </div>
        <p className="text-caption text-text-muted">Controls are visible in demo mode but cannot mutate authoritative tournament state.</p>
      </section>
    </div>
  );
}

function JudgePanel({ catches }: { catches: number }) {
  return (
    <div className="flex flex-col gap-space-4">
      <section className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`}>
        <div className="flex items-center justify-between gap-space-3"><h2 className="text-h3 text-text-primary">Review queue</h2><span className="text-caption text-text-muted">{catches > 0 ? Math.min(catches, 2) : 1} pending</span></div>
        <article className="rounded-lg border border-hairline bg-surface-muted p-space-3">
          <p className="text-body-strong text-text-primary">Yellowtail · evidence review</p>
          <p className="text-caption text-text-muted">QR context warning · GPS evidence preserved · score unchanged pending human decision.</p>
          <div className="mt-space-3 grid grid-cols-2 gap-space-2">
            <button type="button" className={TOURNAMENT_SECONDARY_BUTTON}>View evidence</button>
            <button type="button" className={TOURNAMENT_PRIMARY_BUTTON}>Record decision</button>
          </div>
        </article>
        <p className="text-caption text-text-muted">Judges can approve, reject, penalize, reverse, or resolve a dispute with a reason. Finance actions are intentionally unavailable here.</p>
      </section>
    </div>
  );
}

function LeaderboardPanel() {
  return (
    <section className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`}>
      <div><h2 className="text-h3 text-text-primary">Official leaderboard</h2><p className="text-caption text-text-muted">Public-safe standings only. Raw GPS, evidence, Fair Play signals, and private review notes are excluded.</p></div>
      <ol className="flex flex-col gap-space-2">
        {DEMO_STANDINGS.map((row) => (
          <li key={`${row.rank}-${row.angler}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-space-3 rounded-lg border border-hairline p-space-3">
            <span className="text-h3 text-text-primary">{row.rank}</span>
            <span><span className="block text-body-strong text-text-primary">{row.angler}</span><span className="text-caption text-text-muted">{row.fish}</span></span>
            <span className="text-right"><span className="block text-body-strong text-text-primary">{row.weightLb.toFixed(1)} lb</span><span className="text-caption capitalize text-text-muted">{row.status}</span></span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FinancePanel() {
  return (
    <div className="flex flex-col gap-space-4">
      <section className="grid gap-space-3 sm:grid-cols-3" aria-label="Tournament finance summary">
        <Metric label="Entry receipts" value="$1,250" />
        <Metric label="Prize pool" value="$1,000" />
        <Metric label="Payout state" value="Draft" />
      </section>
      <section className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`}>
        <h2 className="text-h3 text-text-primary">Payout approval</h2>
        <p className="text-body text-text-muted">Final standings may calculate payout instructions, but scoring cannot move money. A finance-authorized human must approve execution separately.</p>
        <button type="button" className={TOURNAMENT_PRIMARY_BUTTON} disabled>Approve payout instruction</button>
        <p className="text-caption text-text-muted">Provider secrets, payment tokens, wallet credentials, and raw account capabilities are never shown here.</p>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className={`${TOURNAMENT_CARD} flex flex-col gap-space-1`}><span className="text-caption text-text-muted">{label}</span><span className="text-body-strong text-text-primary">{value}</span></article>;
}
