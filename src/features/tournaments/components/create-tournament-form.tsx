"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { createDemoTournament, hasSupabaseBrowserConfig } from "../demo-store";
import { TOURNAMENT_INPUT, TOURNAMENT_PRIMARY_BUTTON, TOURNAMENT_SECONDARY_BUTTON } from "../ui-classes";

const VISIBILITIES = ["PRIVATE", "INVITE_ONLY", "UNLISTED", "PUBLIC"] as const;

function toIsoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function CreateTournamentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<(typeof VISIBILITIES)[number]>("PRIVATE");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoMode = !hasSupabaseBrowserConfig();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (demoMode) {
      const tournament = createDemoTournament({
        name: name.trim(),
        visibility,
        starts_at: toIsoOrNull(startsAt),
        ends_at: toIsoOrNull(endsAt),
      });
      router.push(`/tournaments/${tournament.id}/overview`);
      router.refresh();
      return;
    }

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setError("Sign in before creating a tournament.");
        return;
      }

      const { data: organizationId, error: organizationError } = await supabase.rpc("ensure_personal_organization");
      if (organizationError || !organizationId) {
        setError(organizationError?.message ?? "Your tournament workspace could not be prepared.");
        return;
      }

      const { data, error: insertError } = await supabase.from("tournament").insert({
        organization_id: organizationId,
        name: name.trim(),
        visibility,
        status: "DRAFT",
        starts_at: toIsoOrNull(startsAt),
        ends_at: toIsoOrNull(endsAt),
        created_by: authData.user.id,
      }).select("id").single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push(`/tournaments/${data.id}/overview`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tournament could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-space-5">
      {demoMode ? <p className="text-caption text-text-muted">Demo mode · this tournament will be saved only on this device.</p> : null}
      <label className="flex flex-col gap-space-2">
        <span className="text-label text-text-primary">Tournament name</span>
        <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={TOURNAMENT_INPUT} placeholder="Saturday Yellowtail Challenge" />
      </label>

      <fieldset className="flex flex-col gap-space-2">
        <legend className="text-label text-text-primary">Who can see it?</legend>
        <div className="grid grid-cols-2 gap-space-2">
          {VISIBILITIES.map((option) => (
            <button key={option} type="button" onClick={() => setVisibility(option)} aria-pressed={visibility === option} className={visibility === option ? TOURNAMENT_PRIMARY_BUTTON : TOURNAMENT_SECONDARY_BUTTON}>
              {option.toLowerCase().replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-space-4 sm:grid-cols-2">
        <label className="flex flex-col gap-space-2">
          <span className="text-label text-text-primary">Starts</span>
          <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={TOURNAMENT_INPUT} />
        </label>
        <label className="flex flex-col gap-space-2">
          <span className="text-label text-text-primary">Ends</span>
          <input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className={TOURNAMENT_INPUT} />
        </label>
      </div>

      <p className="text-caption text-text-muted">This starts as a draft. Rules, scoring, verification and boundaries can be configured before it goes live.</p>
      {error ? <p className="text-body text-error-red" role="alert">{error}</p> : null}
      <button type="submit" disabled={submitting || name.trim().length === 0} className={TOURNAMENT_PRIMARY_BUTTON}>{submitting ? "Creating…" : "Create tournament"}</button>
    </form>
  );
}
