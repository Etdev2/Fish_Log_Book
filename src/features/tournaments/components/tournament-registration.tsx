"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getDemoEntry, hasSupabaseBrowserConfig, registerDemoEntry, type DemoEntry } from "../demo-store";
import { entrySteps, statusPresentation, TONE_CLASSES, type StatusTone } from "../format";
import { useDemoMode, useTournament } from "../use-tournament";
import { BIG_ACTION, CARD_PADDED, INPUT, INSET, PAGE, SECONDARY_BUTTON } from "../ui-classes";
import { AlertIcon, CheckIcon, PendingIcon } from "./icons";
import {
  BackLink,
  DemoNote,
  ErrorScreen,
  LoadingScreen,
  SectionHeading,
  TonePill,
  TournamentHero,
  TournamentTabs,
} from "./tournament-chrome";

type ExistingEntry = Pick<
  DemoEntry,
  "id" | "registration_status" | "eligibility_status" | "check_in_status" | "competition_status"
>;

type EntryGuidance = {
  readonly tone: StatusTone;
  readonly label: string;
  readonly title: string;
  readonly body: string;
  readonly href?: string;
  readonly action?: string;
};

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
        eyebrow={<BackLink href={`/tournaments/${tournament.id}/overview`}>Tournament home</BackLink>}
      />

      <TournamentTabs tournamentId={tournament.id} />

      <div className="flex flex-col gap-space-1">
        <span className="text-label text-signal-orange">Step 1 of 3</span>
        <h2 className="text-h2 text-text-primary">My entry</h2>
        <p className="text-body text-text-muted">Know exactly what is complete, what is waiting, and what you need to do next.</p>
      </div>

      {entry ? (
        <EntryStatus tournamentId={tournament.id} tournamentStatus={tournament.status} entry={entry} />
      ) : tournament.status === "REGISTRATION_OPEN" ? (
        <form onSubmit={register} className={`${CARD_PADDED} flex flex-col gap-space-4`}>
          <div className="flex flex-col gap-space-1">
            <SectionHeading>Start your entry</SectionHeading>
            <p className="text-body text-text-muted">Your tournament identity starts here. Any additional host requirements can follow this entry.</p>
          </div>

          <Link href={`/tournaments/${tournament.id}/rules`} className={SECONDARY_BUTTON}>
            Review tournament rules
          </Link>

          <label className="flex flex-col gap-space-2">
            <span className="text-label text-text-primary">Name on the standings</span>
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
            <span className="text-caption text-text-muted">This is the name other anglers will see on tournament screens.</span>
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
            <p className="text-caption text-text-muted">Add the name you want shown on the standings.</p>
          ) : null}
        </form>
      ) : (
        <section className={`${CARD_PADDED} flex flex-col gap-space-3`}>
          <SectionHeading>Entries are not open</SectionHeading>
          <p className="text-body text-text-primary">{statusPresentation(tournament.status).blurb}</p>
          <p className="text-caption text-text-muted">
            {tournament.status === "DRAFT"
              ? "The host has not opened registration yet."
              : "If you believe you should already be entered, contact the tournament host."}
          </p>
          <Link href={`/tournaments/${tournament.id}/overview`} className={SECONDARY_BUTTON}>
            Tournament home
          </Link>
        </section>
      )}

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}

function EntryStatus({
  tournamentId,
  tournamentStatus,
  entry,
}: {
  tournamentId: string;
  tournamentStatus: string;
  entry: ExistingEntry;
}) {
  const steps = entrySteps(entry);
  const guidance = entryGuidance(entry, tournamentStatus, tournamentId);

  return (
    <section className={`${CARD_PADDED} flex flex-col gap-space-5`} aria-labelledby="entry-heading">
      <div className={`${INSET} flex flex-col gap-space-3`}>
        <div className="flex flex-wrap items-center justify-between gap-space-2">
          <TonePill tone={guidance.tone}>{guidance.label}</TonePill>
          <span className="text-caption text-text-muted">Your next move</span>
        </div>
        <div className="flex flex-col gap-space-1">
          <h3 className="text-h3 text-text-primary">{guidance.title}</h3>
          <p className="text-body text-text-muted">{guidance.body}</p>
        </div>
        {guidance.href && guidance.action ? (
          <Link href={guidance.href} className={SECONDARY_BUTTON}>
            {guidance.action}
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-space-3">
        <SectionHeading>
          <span id="entry-heading">Entry checklist</span>
        </SectionHeading>
        <ol className="flex flex-col gap-space-4">
          {steps.map((item, index) => {
            const classes = TONE_CLASSES[item.tone];
            const Icon =
              item.tone === "open" || item.tone === "live"
                ? CheckIcon
                : item.tone === "attention" || item.tone === "stopped"
                  ? AlertIcon
                  : PendingIcon;
            return (
              <li key={item.label} className="grid grid-cols-[auto_auto_1fr] items-start gap-space-3">
                <span className="flex h-space-7 w-space-7 items-center justify-center rounded-full border border-hairline text-caption text-text-muted">
                  {index + 1}
                </span>
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
      </div>

      <div className="flex flex-wrap gap-space-2 border-t border-hairline pt-space-4">
        <Link href={`/tournaments/${tournamentId}/rules`} className={SECONDARY_BUTTON}>
          Review rules
        </Link>
        {entry.competition_status === "ACTIVE" ? (
          <Link href={`/tournaments/${tournamentId}/catches`} className={SECONDARY_BUTTON}>
            Go to Compete
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function entryGuidance(entry: ExistingEntry, tournamentStatus: string, tournamentId: string): EntryGuidance {
  if (entry.competition_status === "ACTIVE") {
    return {
      tone: "live",
      label: "Fishing now",
      title: "You are active in this tournament",
      body: "Your entry is live. Log catches as you land them and watch their submission status from the Compete screen.",
      href: `/tournaments/${tournamentId}/catches`,
      action: "Go to Compete",
    };
  }

  if (entry.competition_status === "DISQUALIFIED") {
    return {
      tone: "stopped",
      label: "Needs attention",
      title: "This entry is disqualified",
      body: "A judge has recorded this state. Review the tournament rules and contact the host if you need the decision explained.",
      href: `/tournaments/${tournamentId}/rules`,
      action: "Review rules",
    };
  }

  if (entry.competition_status === "WITHDRAWN" || entry.registration_status === "CANCELLED") {
    return {
      tone: "stopped",
      label: "Not competing",
      title: "This entry is no longer active",
      body: "You are not currently part of the competitive field for this tournament.",
    };
  }

  if (entry.registration_status === "PAYMENT_REQUIRED") {
    return {
      tone: "attention",
      label: "Action needed",
      title: "Payment is the next requirement",
      body: "Your place is being held, but the entry is not fully confirmed until the tournament's payment requirement is satisfied.",
    };
  }

  if (entry.registration_status !== "CONFIRMED") {
    return {
      tone: entry.registration_status === "WAITLISTED" ? "attention" : "neutral",
      label: entry.registration_status === "WAITLISTED" ? "Waitlisted" : "Waiting",
      title: entry.registration_status === "WAITLISTED" ? "You are waiting for a spot" : "Your entry is with the host",
      body: entry.registration_status === "WAITLISTED"
        ? "You are not in the active field yet. The host can confirm you if a place opens."
        : "Your entry has been submitted. The host still needs to confirm your place.",
    };
  }

  if (entry.eligibility_status === "ACTION_REQUIRED") {
    return {
      tone: "attention",
      label: "Action needed",
      title: "The host needs something from you",
      body: "Your place is confirmed, but eligibility is waiting on additional information. Check with the tournament host before lines in.",
    };
  }

  if (entry.eligibility_status === "INELIGIBLE") {
    return {
      tone: "stopped",
      label: "Not eligible",
      title: "You are not cleared to compete",
      body: "The entry is confirmed, but the eligibility check did not clear. Ask the host what would need to change.",
    };
  }

  if (entry.eligibility_status !== "ELIGIBLE") {
    return {
      tone: "neutral",
      label: "Being checked",
      title: "Eligibility is the next checkpoint",
      body: "Your place is confirmed. The host still needs to clear the eligibility requirements for this tournament.",
    };
  }

  if (entry.check_in_status === "MISSED") {
    return {
      tone: "attention",
      label: "Action needed",
      title: "Check-in was missed",
      body: "Talk to the host before fishing. A confirmed and eligible entry can still be held out if check-in is unresolved.",
    };
  }

  if (entry.check_in_status !== "CHECKED_IN") {
    return {
      tone: tournamentStatus === "LIVE" ? "attention" : "neutral",
      label: tournamentStatus === "LIVE" ? "Check in now" : "Next: check-in",
      title: tournamentStatus === "LIVE" ? "The tournament is live, but you are not checked in" : "You are cleared — check-in is next",
      body: tournamentStatus === "LIVE"
        ? "Resolve check-in with the host before you fish so your entry status is clear."
        : "Your place and eligibility are good. Check in at the event before lines in.",
    };
  }

  if (tournamentStatus === "FINAL" || tournamentStatus === "COMPLETED" || tournamentStatus === "RESULTS_PENDING") {
    return {
      tone: tournamentStatus === "FINAL" ? "done" : "neutral",
      label: tournamentStatus === "FINAL" ? "Finished" : "Fishing finished",
      title: tournamentStatus === "FINAL" ? "This tournament is complete" : "Your fishing is done",
      body: tournamentStatus === "FINAL"
        ? "Results are official. Head to Results to see the final standings."
        : "Lines are out. Results can still move while judging is completed.",
      href: `/tournaments/${tournamentId}/leaderboard`,
      action: "View Results",
    };
  }

  return {
    tone: "open",
    label: "Ready",
    title: "You are ready for lines in",
    body: "Your place is confirmed, eligibility is clear, and check-in is complete. Nothing else is blocking your entry.",
  };
}
