"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import {
  defaultFormat,
  FORMAT_PRESETS,
  validateFormat,
  type TournamentFormat,
} from "@/core/tournaments/formats";
import { createClient } from "@/lib/supabase/client";
import { createDemoTournament, hasSupabaseBrowserConfig } from "../demo-store";
import { formatSchedule, visibilityPresentation } from "../format";
import { saveFormat } from "../use-format";
import {
  BIG_ACTION,
  CARD_PADDED,
  FOCUS_RING,
  INPUT,
  SECONDARY_BUTTON,
  TERTIARY_BUTTON,
} from "../ui-classes";
import { FormatEditor, FormatSummary } from "./format-editor";
import { CheckRow, DemoNote } from "./tournament-chrome";

/**
 * Create a tournament — three questions, one per screen.
 *
 * The old form asked all of it at once: name, four visibility buttons, two
 * `datetime-local` fields, and a paragraph about drafts, in a single column with one
 * validation rule (a non-empty name). UX-001 §4 asks for the opposite shape — a casual
 * user creating a private tournament in a few steps, with everything else revealed only
 * when it is wanted — and on a phone one question at a time is also simply easier to
 * answer with one thumb.
 *
 * What this screen deliberately does **not** do is ask for scoring, verification, or
 * boundaries. Those four frozen inputs are real objects with their own versioned
 * lifecycle (`core/tournaments/lifecycle.ts`), the tables to hold a choice made here do
 * not exist yet, and a wizard step that collects a preference and quietly drops it is
 * worse than no step. The review names them as what comes next, and the overview's
 * readiness checklist is where they get set.
 */

const VISIBILITIES = ["PRIVATE", "INVITE_ONLY", "UNLISTED", "PUBLIC"] as const;

type Visibility = (typeof VISIBILITIES)[number];

const STEPS = ["The basics", "Who can see it", "How it is won", "Check it over"] as const;

function toIsoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function CreateTournamentForm() {
  const router = useRouter();
  const fieldId = useId();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [presetId, setPresetId] = useState<string | null>(null);
  const [format, setFormat] = useState<TournamentFormat>(defaultFormat);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoMode = !hasSupabaseBrowserConfig();

  /**
   * The one rule worth enforcing here. Everything else about a tournament can be changed
   * later; a window that ends before it starts produces a negative clock on every screen
   * downstream, and the old form would happily create one.
   */
  const scheduleProblem =
    startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()
      ? "The finish has to be after the start."
      : null;

  const formatProblems = validateFormat(format);

  const stepReady =
    step === 0
      ? name.trim().length > 0 && !scheduleProblem
      : step === 2
        ? presetId !== null && formatProblems.length === 0
        : true;

  async function create() {
    setSubmitting(true);
    setError(null);

    if (demoMode) {
      const tournament = createDemoTournament({
        name: name.trim(),
        visibility,
        starts_at: toIsoOrNull(startsAt),
        ends_at: toIsoOrNull(endsAt),
      });
      await saveFormat(tournament.id, format);
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

      const { data: organizationId, error: organizationError } = await supabase.rpc(
        "ensure_personal_organization",
      );
      if (organizationError || !organizationId) {
        setError(organizationError?.message ?? "Your tournament workspace could not be prepared.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("tournament")
        .insert({
          organization_id: organizationId,
          name: name.trim(),
          visibility,
          status: "DRAFT",
          starts_at: toIsoOrNull(startsAt),
          ends_at: toIsoOrNull(endsAt),
          created_by: authData.user.id,
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      /*
        The tournament and its format are two writes, not one. If the second fails the
        first still stands — a draft with no format is a real, recoverable state that the
        overview's readiness checklist already knows how to show — so the failure is
        reported against the tournament that exists rather than rolled back into nothing.
      */
      const saved = await saveFormat(data.id, format);
      if (!saved.ok) {
        setError(
          `The tournament was created, but its scoring could not be saved: ${saved.message} You can set it from the tournament's own screen.`,
        );
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
    <div className="flex flex-col gap-space-5">
      <ol className="flex gap-space-2" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`h-space-2 flex-1 rounded-full transition-colors ${
              index <= step ? "bg-signal-orange" : "bg-surface-raised"
            }`}
          >
            <span className="sr-only">
              {label}
              {index === step ? " (current)" : ""}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-caption text-text-muted" aria-hidden="true">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>

      {step === 0 ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-5`}>
          <div className="flex flex-col gap-space-2">
            <label htmlFor={`${fieldId}-name`} className="text-label text-text-primary">
              What is it called?
            </label>
            <input
              id={`${fieldId}-name`}
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={INPUT}
              placeholder="Saturday Yellowtail Challenge"
            />
            <p className="text-caption text-text-muted">
              Whatever you would call it out loud. You can change this later.
            </p>
          </div>

          <div className="flex flex-col gap-space-3">
            <p className="text-label text-text-primary">When is it?</p>
            <div className="grid gap-space-4 sm:grid-cols-2">
              <label className="flex flex-col gap-space-2">
                <span className="text-caption text-text-muted">Lines in</span>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className={INPUT}
                />
              </label>
              <label className="flex flex-col gap-space-2">
                <span className="text-caption text-text-muted">Lines out</span>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  className={INPUT}
                  aria-invalid={scheduleProblem ? true : undefined}
                  aria-describedby={scheduleProblem ? `${fieldId}-schedule-error` : undefined}
                />
              </label>
            </div>
            {scheduleProblem ? (
              <p id={`${fieldId}-schedule-error`} role="alert" className="text-body text-error-red">
                {scheduleProblem}
              </p>
            ) : (
              <p className="text-caption text-text-muted">
                Leave these empty if you have not settled on a day yet.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <fieldset className={`${CARD_PADDED} flex flex-col gap-space-3`}>
          <legend className="text-label text-text-primary">Who can see it?</legend>
          <p className="text-caption text-text-muted">
            This is the only privacy decision you have to make now, and it can be changed while the
            tournament is still a draft.
          </p>
          <div className="flex flex-col gap-space-2">
            {VISIBILITIES.map((option) => {
              const { label, blurb } = visibilityPresentation(option);
              const selected = visibility === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setVisibility(option)}
                  className={`${FOCUS_RING} flex min-h-touch-floor flex-col items-start gap-space-1 rounded-md border p-space-3 text-left transition-colors active:scale-[0.995] motion-reduce:transition-none ${
                    selected
                      ? "border-signal-orange bg-signal-orange/10"
                      : "border-border-interactive bg-surface hover:border-text-link"
                  }`}
                >
                  <span className={`text-label ${selected ? "text-signal-orange" : "text-text-primary"}`}>
                    {label}
                  </span>
                  <span className="text-caption text-text-muted">{blurb}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {/*
        The format step, shaped like the Boat Games mode picker: four cards that each build
        a complete, valid tournament, and only then the parts worth changing. A host who
        taps "Heaviest fish wins" and then Next has made every decision the scorer needs.
      */}
      {step === 2 ? (
        <div className="flex flex-col gap-space-4">
          {presetId === null ? (
            <ul className="flex flex-col gap-space-3">
              {FORMAT_PRESETS.map((preset) => (
                <li key={preset.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPresetId(preset.id);
                      setFormat(preset.build());
                    }}
                    className={`${CARD_PADDED} ${FOCUS_RING} flex w-full flex-col gap-space-2 text-left transition-colors hover:border-border-interactive active:scale-[0.995] motion-reduce:transition-none`}
                  >
                    <span className="text-h3 text-text-primary">{preset.name}</span>
                    <span className="text-body text-text-muted">{preset.tagline}</span>
                    <ul className="flex list-disc flex-col gap-space-1 pl-space-4 text-caption text-text-muted">
                      {preset.how.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-space-2">
                <h2 className="text-h3 text-text-primary">
                  {FORMAT_PRESETS.find((preset) => preset.id === presetId)?.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setPresetId(null)}
                  className={`${FOCUS_RING} min-h-touch-floor text-caption text-text-link`}
                >
                  Pick a different one
                </button>
              </div>
              <FormatEditor format={format} onChange={setFormat} />
            </>
          )}
        </div>
      ) : null}

      {step === 3 ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-4`}>
          <div className="flex flex-col gap-space-2">
            <h2 className="text-h3 text-text-primary">{name.trim() || "Untitled tournament"}</h2>
            <p className="text-body text-text-muted">{formatSchedule(toIsoOrNull(startsAt), toIsoOrNull(endsAt))}</p>
            <p className="text-caption text-text-muted">
              {visibilityPresentation(visibility).label} · {visibilityPresentation(visibility).blurb}
            </p>
          </div>

          <div className="flex flex-col gap-space-3 border-t border-hairline pt-space-4">
            <p className="text-label text-text-primary">How it is won</p>
            <FormatSummary format={format} />
          </div>

          <div className="flex flex-col gap-space-3 border-t border-hairline pt-space-4">
            <p className="text-label text-text-primary">What happens next</p>
            <ul className="flex flex-col gap-space-3">
              <CheckRow
                state="done"
                label="It is created as a draft"
                detail="Nobody can enter until you open registration, so nothing is public by accident."
              />
              <CheckRow
                state="done"
                label="Scoring is set"
                detail="You can change it while the tournament is still a draft. Once it starts, it is fixed — that is what makes the result defensible."
              />
              <CheckRow
                state="pending"
                label="Three things still get locked before it can go live"
                detail="The rules, what counts as proof of a catch, and where you can fish. The overview walks you through them."
              />
              <CheckRow
                state="pending"
                label="Then you invite people"
                detail="Open registration when you are ready and share the tournament."
              />
            </ul>
          </div>

          {error ? (
            <p role="alert" className="text-body text-error-red">
              {error}
            </p>
          ) : null}

          {demoMode ? <DemoNote>Demo mode — this tournament is saved on this phone only.</DemoNote> : null}
        </section>
      ) : null}

      <div className="flex flex-col gap-space-3">
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className={BIG_ACTION}
            disabled={!stepReady}
            aria-describedby={!stepReady ? `${fieldId}-next-hint` : undefined}
            onClick={() => setStep((current) => current + 1)}
          >
            Next
          </button>
        ) : (
          <button type="button" className={BIG_ACTION} disabled={submitting} onClick={create}>
            {submitting ? "Creating…" : "Create tournament"}
          </button>
        )}

        {!stepReady ? (
          <p id={`${fieldId}-next-hint`} className="text-caption text-text-muted">
            {step === 2
              ? presetId === null
                ? "Pick how it is won to carry on."
                : "Fix the notes above to carry on."
              : scheduleProblem
                ? "Fix the times to carry on."
                : "Give it a name to carry on."}
          </p>
        ) : null}

        {step > 0 ? (
          <button
            type="button"
            className={step === STEPS.length - 1 ? SECONDARY_BUTTON : TERTIARY_BUTTON}
            onClick={() => setStep((current) => current - 1)}
          >
            Back
          </button>
        ) : null}
      </div>
    </div>
  );
}
