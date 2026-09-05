"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { TOURNAMENT_CARD, TOURNAMENT_INPUT, TOURNAMENT_PRIMARY_BUTTON, TOURNAMENT_SECONDARY_BUTTON } from "../ui-classes";

type TournamentRegistrationState = {
  id: string;
  name: string;
  status: string;
  visibility: string;
};

type ExistingEntry = {
  id: string;
  registration_status: string;
  eligibility_status: string;
  check_in_status: string;
  competition_status: string;
};

export function TournamentRegistration({ tournamentId }: { tournamentId: string }) {
  const [tournament, setTournament] = useState<TournamentRegistrationState | null>(null);
  const [entry, setEntry] = useState<ExistingEntry | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const { data: tournamentData, error: tournamentError } = await supabase
      .from("tournament")
      .select("id,name,status,visibility")
      .eq("id", tournamentId)
      .maybeSingle();

    if (tournamentError || !tournamentData) {
      setError(tournamentError?.message ?? "Tournament unavailable.");
      setLoading(false);
      return;
    }

    setTournament(tournamentData as TournamentRegistrationState);

    if (authData.user) {
      const { data: identityRows } = await supabase
        .from("tournament_entry_identity")
        .select("tournament_entry_id")
        .eq("claimed_angler_id", authData.user.id);

      const candidateIds = (identityRows ?? []).map((row) => row.tournament_entry_id);
      if (candidateIds.length > 0) {
        const { data: entryData } = await supabase
          .from("tournament_entry")
          .select("id,registration_status,eligibility_status,check_in_status,competition_status")
          .eq("tournament_id", tournamentId)
          .in("id", candidateIds)
          .is("deleted_at", null)
          .maybeSingle();
        setEntry((entryData as ExistingEntry | null) ?? null);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(refresh);
    // tournamentId is the only external input; refresh intentionally owns the client instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: registrationError } = await supabase.rpc("register_self_for_tournament", {
      target_tournament_id: tournamentId,
      participant_display_name: displayName.trim(),
    });

    if (registrationError) {
      setError(registrationError.message);
      setSubmitting(false);
      return;
    }

    await refresh();
    setSubmitting(false);
  }

  if (loading) {
    return <div className="mx-auto max-w-reading px-space-4 py-space-5 text-body text-text-muted">Loading registration…</div>;
  }

  if (!tournament) {
    return <div className="mx-auto max-w-reading px-space-4 py-space-5 text-body text-error-red">{error ?? "Tournament unavailable."}</div>;
  }

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-5 px-space-4 py-space-5">
      <header className="flex flex-col gap-space-2">
        <Link href={`/tournaments/${tournament.id}/overview`} className="text-caption text-text-link">← Overview</Link>
        <h1 className="text-h1 text-text-primary">Register</h1>
        <p className="text-body text-text-muted">{tournament.name}</p>
      </header>

      {entry ? (
        <section className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`}>
          <h2 className="text-h3 text-text-primary">Your entry</h2>
          <dl className="grid grid-cols-2 gap-space-3 text-caption">
            <div><dt className="text-text-muted">Registration</dt><dd className="capitalize text-text-primary">{entry.registration_status.toLowerCase().replaceAll("_", " ")}</dd></div>
            <div><dt className="text-text-muted">Eligibility</dt><dd className="capitalize text-text-primary">{entry.eligibility_status.toLowerCase().replaceAll("_", " ")}</dd></div>
            <div><dt className="text-text-muted">Check-in</dt><dd className="capitalize text-text-primary">{entry.check_in_status.toLowerCase().replaceAll("_", " ")}</dd></div>
            <div><dt className="text-text-muted">Competition</dt><dd className="capitalize text-text-primary">{entry.competition_status.toLowerCase().replaceAll("_", " ")}</dd></div>
          </dl>
          <p className="text-caption text-text-muted">Payment, eligibility and competition status are tracked separately so one cannot silently change another.</p>
        </section>
      ) : tournament.status === "REGISTRATION_OPEN" ? (
        <form onSubmit={register} className={`${TOURNAMENT_CARD} flex flex-col gap-space-4`}>
          <div className="flex flex-col gap-space-1">
            <h2 className="text-h3 text-text-primary">Enter tournament</h2>
            <p className="text-caption text-text-muted">Your account is linked to this entry, while the tournament keeps its own historical participant identity.</p>
          </div>
          <label className="flex flex-col gap-space-2">
            <span className="text-label text-text-primary">Display name</span>
            <input required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={TOURNAMENT_INPUT} placeholder="Name shown in the tournament" />
          </label>
          {error ? <p role="alert" className="text-body text-error-red">{error}</p> : null}
          <button type="submit" className={TOURNAMENT_PRIMARY_BUTTON} disabled={submitting || displayName.trim().length === 0}>
            {submitting ? "Registering…" : "Register"}
          </button>
        </form>
      ) : (
        <section className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`}>
          <h2 className="text-h3 text-text-primary">Registration is not open</h2>
          <p className="text-body text-text-muted">Current tournament state: {tournament.status.toLowerCase().replaceAll("_", " ")}.</p>
          <Link href={`/tournaments/${tournament.id}/overview`} className={TOURNAMENT_SECONDARY_BUTTON}>Back to overview</Link>
        </section>
      )}
    </div>
  );
}
