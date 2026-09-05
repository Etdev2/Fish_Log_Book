"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { TOURNAMENT_CARD, TOURNAMENT_PRIMARY_BUTTON } from "../ui-classes";

type TournamentCardData = {
  id: string;
  name: string;
  status: string;
  visibility: string;
  starts_at: string | null;
  ends_at: string | null;
  organization_id: string;
};

function statusLabel(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

function whenLabel(value: string | null) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}

export function TournamentHub() {
  const [owned, setOwned] = useState<TournamentCardData[]>([]);
  const [publicTournaments, setPublicTournaments] = useState<TournamentCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const [ownedResult, publicResult] = await Promise.all([
          supabase
            .from("tournament")
            .select("id,name,status,visibility,starts_at,ends_at,organization_id")
            .is("deleted_at", null)
            .order("created_at", { ascending: false }),
          supabase
            .from("public_tournament")
            .select("id,name,status,visibility,starts_at,ends_at,organization_id")
            .eq("visibility", "PUBLIC")
            .order("created_at", { ascending: false })
            .limit(12),
        ]);

        if (cancelled) return;
        const firstError = ownedResult.error ?? publicResult.error;
        if (firstError) {
          setError(firstError.message);
          return;
        }

        setOwned((ownedResult.data ?? []) as TournamentCardData[]);
        setPublicTournaments((publicResult.data ?? []) as TournamentCardData[]);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Tournament data could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-6 px-space-4 py-space-5">
      <header className="flex flex-col gap-space-3">
        <div className="flex items-start justify-between gap-space-4">
          <div className="flex flex-col gap-space-1">
            <h1 className="text-h1 text-text-primary">Tournaments</h1>
            <p className="text-body text-text-muted">
              Run a private trip competition or a full public event from the same tournament engine.
            </p>
          </div>
        </div>
        <Link href="/tournaments/new" className={TOURNAMENT_PRIMARY_BUTTON}>
          Create tournament
        </Link>
      </header>

      {loading ? <p className="text-body text-text-muted">Loading tournaments…</p> : null}
      {error ? (
        <div className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`} role="alert">
          <div className="flex flex-col gap-space-1">
            <p className="text-body-strong text-error-red">Tournament data could not be loaded.</p>
            <p className="text-caption text-text-muted">{error}</p>
          </div>
          <button type="button" className={TOURNAMENT_PRIMARY_BUTTON} onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <TournamentSection
            title="My tournaments"
            empty="You have not created or joined a tournament yet."
            tournaments={owned}
          />
          <TournamentSection
            title="Public tournaments"
            empty="No public tournaments are available right now."
            tournaments={publicTournaments.filter((item) => !owned.some((own) => own.id === item.id))}
          />
        </>
      ) : null}
    </div>
  );
}

function TournamentSection({
  title,
  empty,
  tournaments,
}: {
  title: string;
  empty: string;
  tournaments: TournamentCardData[];
}) {
  return (
    <section className="flex flex-col gap-space-3" aria-labelledby={`${title.replaceAll(" ", "-").toLowerCase()}-heading`}>
      <h2 id={`${title.replaceAll(" ", "-").toLowerCase()}-heading`} className="text-h3 text-text-primary">
        {title}
      </h2>
      {tournaments.length === 0 ? (
        <p className={`${TOURNAMENT_CARD} text-body text-text-muted`}>{empty}</p>
      ) : (
        <ul className="flex flex-col gap-space-3">
          {tournaments.map((tournament) => (
            <li key={tournament.id}>
              <Link
                href={`/tournaments/${tournament.id}/overview`}
                className={`${TOURNAMENT_CARD} flex min-h-touch-floor flex-col gap-space-2`}
              >
                <span className="flex flex-wrap items-start justify-between gap-space-2">
                  <span className="text-body-strong text-text-primary">{tournament.name}</span>
                  <span className="rounded-full border border-hairline px-space-2 py-space-1 text-caption capitalize text-text-muted">
                    {statusLabel(tournament.status)}
                  </span>
                </span>
                <span className="text-caption text-text-muted">
                  {whenLabel(tournament.starts_at)} · {tournament.visibility.toLowerCase().replaceAll("_", " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
