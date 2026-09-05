"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { TournamentStatus } from "@/core/tournaments/lifecycle";
import { TOURNAMENT_CARD, TOURNAMENT_SECONDARY_BUTTON } from "../ui-classes";

type TournamentOverviewData = {
  id: string;
  name: string;
  status: TournamentStatus;
  visibility: string;
  starts_at: string | null;
  ends_at: string | null;
  organization_id: string;
  active_rule_set_version_id: string | null;
  active_scoring_version_id: string | null;
  active_verification_policy_version_id: string | null;
  active_boundary_version_id: string | null;
};

const NAV_ITEMS = [
  ["Overview", "overview"],
  ["Register", "register"],
  ["Catches", "catches"],
  ["Leaderboard", "leaderboard"],
  ["Rules", "rules"],
] as const;

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function TournamentOverview({ tournamentId }: { tournamentId: string }) {
  const [tournament, setTournament] = useState<TournamentOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const { data, error: queryError } = await supabase
        .from("tournament")
        .select(
          "id,name,status,visibility,starts_at,ends_at,organization_id,active_rule_set_version_id,active_scoring_version_id,active_verification_policy_version_id,active_boundary_version_id",
        )
        .eq("id", tournamentId)
        .is("deleted_at", null)
        .maybeSingle();

      if (cancelled) return;
      if (queryError) setError(queryError.message);
      else if (!data) setError("Tournament not found or you do not have access.");
      else setTournament(data as TournamentOverviewData);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  if (loading) {
    return <div className="mx-auto max-w-reading px-space-4 py-space-5 text-body text-text-muted">Loading tournament…</div>;
  }

  if (error || !tournament) {
    return (
      <div className="mx-auto flex max-w-reading flex-col gap-space-4 px-space-4 py-space-5">
        <p className={`${TOURNAMENT_CARD} text-body text-error-red`} role="alert">{error ?? "Tournament unavailable."}</p>
        <Link href="/tournaments" className={TOURNAMENT_SECONDARY_BUTTON}>Back to tournaments</Link>
      </div>
    );
  }

  const versionsReady = [
    tournament.active_rule_set_version_id,
    tournament.active_scoring_version_id,
    tournament.active_verification_policy_version_id,
    tournament.active_boundary_version_id,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-5 px-space-4 py-space-5">
      <header className="flex flex-col gap-space-3">
        <Link href="/tournaments" className="text-caption text-text-link">← Tournaments</Link>
        <div className="flex flex-col gap-space-1">
          <div className="flex flex-wrap items-center justify-between gap-space-2">
            <h1 className="text-h1 text-text-primary">{tournament.name}</h1>
            <span className="rounded-full border border-hairline px-space-3 py-space-1 text-caption capitalize text-text-muted">
              {tournament.status.toLowerCase().replaceAll("_", " ")}
            </span>
          </div>
          <p className="text-body text-text-muted">
            {formatDate(tournament.starts_at)} · {tournament.visibility.toLowerCase().replaceAll("_", " ")}
          </p>
        </div>
      </header>

      <nav aria-label="Tournament sections" className="overflow-x-auto">
        <ul className="flex min-w-max gap-space-2 pb-space-1">
          {NAV_ITEMS.map(([label, route]) => (
            <li key={route}>
              <Link
                href={`/tournaments/${tournament.id}/${route}`}
                className="inline-flex min-h-touch-floor items-center rounded-full border border-hairline bg-surface px-space-3 text-label text-text-primary"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`} aria-labelledby="readiness-heading">
        <div className="flex items-center justify-between gap-space-3">
          <h2 id="readiness-heading" className="text-h3 text-text-primary">Competition readiness</h2>
          <span className="text-caption text-text-muted">{versionsReady}/4 locked inputs selected</span>
        </div>
        <div className="h-space-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
          <div className="h-full bg-action" style={{ width: `${versionsReady * 25}%` }} />
        </div>
        <p className="text-caption text-text-muted">
          Rules, scoring, verification policy and tournament boundaries must all be frozen before READY can move to LIVE.
        </p>
      </section>

      <section className="grid gap-space-3 sm:grid-cols-2" aria-label="Tournament summary">
        <article className={`${TOURNAMENT_CARD} flex flex-col gap-space-1`}>
          <span className="text-caption text-text-muted">Starts</span>
          <span className="text-body-strong text-text-primary">{formatDate(tournament.starts_at)}</span>
        </article>
        <article className={`${TOURNAMENT_CARD} flex flex-col gap-space-1`}>
          <span className="text-caption text-text-muted">Ends</span>
          <span className="text-body-strong text-text-primary">{formatDate(tournament.ends_at)}</span>
        </article>
      </section>

      <section className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`}>
        <h2 className="text-h3 text-text-primary">Next actions</h2>
        <p className="text-body text-text-muted">
          Registration, live catch logging, judging, operations and finance screens are being added in the next UI lanes without changing this tournament contract.
        </p>
      </section>
    </div>
  );
}
