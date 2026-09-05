"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getDemoEntry, hasSupabaseBrowserConfig, registerDemoEntry, type DemoEntry } from "../demo-store";
import { entrySteps, statusPresentation, TONE_CLASSES } from "../format";
import { useDemoMode, useTournament } from "../use-tournament";
import { BIG_ACTION, CARD_PADDED, INPUT, PAGE, SECONDARY_BUTTON } from "../ui-classes";
import { AlertIcon, CheckIcon, PendingIcon } from "./icons";
import {
  BackLink,
  DemoNote,
  ErrorScreen,
  LoadingScreen,
  SectionHeading,
  TournamentHero,
  TournamentTabs,
} from "./tournament-chrome";

type ExistingEntry = Pick<
  DemoEntry,
  "id" | "registration_status" | "eligibility_status" | "check_in_status" | "competition_status"
>;

/**
 * /tournaments/[id]/register — entering, and knowing where your entry stands.
 *
 * UX-001 §5: "Do not collapse all state into 'registered'." The old screen technically
 * obeyed that — it printed all four states — but as a 2×2 grid of lowercased enums
 * (`not_checked_in`, `unknown`), which tells an angler standing on a dock exactly nothing
 * about whether they are allowed to fish. Each state now gets a line, a plain word, and
 * the sentence that says what to do about it.
 */
export function TournamentRegistration({ tournamentId }: { tournamentId: string }) {
  const load = useTournament(tournamentId);
  const demoMode = useDemoMode();

  const [entry, setEntry] = useState<ExistingEntry | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();

  const refresh = useCallback(async () => {
    if (!hasSupabaseBrowserConfig()) {
      setEntry(getDemoEntry(tournamentId));
      return;
    }

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    // An entry is reached through the identity claim rather than by user id, because a
    // tournament keeps its own participant identity — the same person can be an entrant in
    // an event they later stop having an account for, and the result still has to stand.
    const { data: identityRows } = await supabase
      .from("tournament_entry_identity")
      .select("tournament_entry_id")
      .eq("claimed_angler_id", authData.user.id);

    const candidateIds = (identityRows ?? []).map((row) => row.tournament_entry_id);
    if (candidateIds.length === 0) {
      setEntry(null);
      return;
    }

    const { data: entryData } = await supabase
      .from("tournament_entry")
      .select("id,registration_status,eligibility_status,check_in_status,competition_status")
      .eq("tournament_id", tournamentId)
      .in("id", candidateIds)
      .is("deleted_at", null)
      .maybeSingle();

    setEntry((entryData as ExistingEntry | null) ?? null);
  }, [tournamentId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (demoMode) {
      setEntry(registerDemoEntry(tournamentId, displayName.trim()));
      setSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: registrationError } = await supabase.rpc("register_self_for_tournament", {
        target_tournament_id: tournamentId,
        participant_display_name: displayName.trim(),
      });
      if (registrationError) setError(registrationError.message);
      else await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (load.state === "loading") return <LoadingScreen label="Loading registration" />;
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

      {entry ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-4`} aria-labelledby="entry-heading">
          <SectionHeading>
            <span id="entry-heading">You are entered</span>
          </SectionHeading>

          {/*
            Four separate states, deliberately. Payment, eligibility, check-in and
            competition move independently — one being green does not make the others
            green, and an entry that is confirmed but not checked in is a real situation a
            person needs to be able to see on a phone at 5am.
          */}
          <ol className="flex flex-col gap-space-4">
            {entrySteps(entry).map((item) => {
              const classes = TONE_CLASSES[item.tone];
              const Icon =
                item.tone === "open" || item.tone === "live"
                  ? CheckIcon
                  : item.tone === "attention" || item.tone === "stopped"
                    ? AlertIcon
                    : PendingIcon;
              return (
                <li key={item.label} className="flex items-start gap-space-3">
                  <span className={`mt-space-1 ${classes.text}`}>
                    <Icon />
                  </span>
                  <span className="flex flex-col gap-space-1">
                    <span className="text-caption text-text-muted">{item.label}</span>
                    <span className={`text-body-strong ${classes.text}`}>{item.value}</span>
                    <span className="text-caption text-text-muted">{item.hint}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          <p className="border-t border-hairline pt-space-3 text-caption text-text-muted">
            These four are tracked separately on purpose, so that none of them can quietly change
            another. Paying does not make you eligible, and checking in does not score you.
          </p>

          <Link href={`/tournaments/${tournament.id}/rules`} className={SECONDARY_BUTTON}>
            What am I signing up to?
          </Link>
        </section>
      ) : tournament.status === "REGISTRATION_OPEN" ? (
        <form onSubmit={register} className={`${CARD_PADDED} flex flex-col gap-space-4`}>
          <SectionHeading>Enter this tournament</SectionHeading>
          <label className="flex flex-col gap-space-2">
            <span className="text-label text-text-primary">What name should show on the board?</span>
            <input
              id={`${fieldId}-name`}
              required
              maxLength={80}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={INPUT}
              placeholder="How your crew knows you"
              autoComplete="nickname"
            />
            <span className="text-caption text-text-muted">
              This is what other anglers see. Your account stays linked to the entry behind the
              scenes, so the tournament keeps its own record even if your account changes later.
            </span>
          </label>

          {error ? (
            <p role="alert" className="text-body text-error-red">
              {error}
            </p>
          ) : null}

          <button type="submit" className={BIG_ACTION} disabled={submitting || displayName.trim().length === 0}>
            {submitting ? "Entering…" : "Enter tournament"}
          </button>
          {displayName.trim().length === 0 ? (
            <p className="text-caption text-text-muted">Add a name to enter.</p>
          ) : null}
        </form>
      ) : (
        <section className={`${CARD_PADDED} flex flex-col gap-space-3`}>
          <SectionHeading>Entries are not open</SectionHeading>
          <p className="text-body text-text-primary">{statusPresentation(tournament.status).blurb}</p>
          <p className="text-caption text-text-muted">
            {tournament.status === "DRAFT"
              ? "The organizer has not opened this one up yet."
              : "If you think you should be in this tournament, the organizer can add you."}
          </p>
          <Link href={`/tournaments/${tournament.id}/overview`} className={SECONDARY_BUTTON}>
            Back to the tournament
          </Link>
        </section>
      )}

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}
