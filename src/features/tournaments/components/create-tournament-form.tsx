"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { parseMoneyToMinor } from "@/core/tournaments/money";
import { createDemoTournament, hasSupabaseBrowserConfig } from "../demo-store";
import { formatMoney } from "../event-card";
import { formatDateTime, formatSchedule, visibilityPresentation } from "../format";
import {
  BIG_ACTION,
  CARD_PADDED,
  FOCUS_RING,
  INPUT,
  SECONDARY_BUTTON,
  TABULAR,
  TERTIARY_BUTTON,
} from "../ui-classes";
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

/*
  A fourth step, added when the event calendar shipped. The calendar's whole job is to
  answer three questions about an event — where it is, what it costs, and how long you have
  to enter — and this form collected none of them, so every event a host actually created
  appeared on it as "Not announced", no fee and no deadline. A create form that cannot fill
  in the screen it feeds is the flow being broken in the middle.

  Its own step rather than more fields on "The basics", which already carries a name and two
  datetimes; six inputs in one column is the wall this wizard was built to avoid.
*/
const STEPS = ["The basics", "Where and what it costs", "Who can see it", "Check it over"] as const;

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
  const [locationName, setLocationName] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [registrationClosesAt, setRegistrationClosesAt] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");
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

  /*
    An empty fee is "not priced yet", which is a legitimate state to create a draft in. A fee
    that was typed and cannot be read is not — that is somebody meaning to charge $40 and
    getting no fee at all, which they would discover from an angler who entered for free.
  */
  const feeParse = entryFee.trim() === "" ? null : parseMoneyToMinor(entryFee);
  const feeProblem =
    feeParse && !feeParse.ok
      ? feeParse.reason === "negative"
        ? "An entry fee cannot be negative."
        : feeParse.reason === "too-precise"
          ? "Entry fees go to the cent — two decimal places."
          : feeParse.reason === "too-large"
            ? "That is larger than any entry fee. Check the number."
            : "Write the entry fee as a number, like 250 or 250.00."
      : null;

  const stepReady =
    step === 0 ? name.trim().length > 0 && !scheduleProblem : step === 1 ? !feeProblem : true;

  async function create() {
    setSubmitting(true);
    setError(null);

    if (demoMode) {
      const tournament = createDemoTournament({
        name: name.trim(),
        visibility,
        starts_at: toIsoOrNull(startsAt),
        ends_at: toIsoOrNull(endsAt),
        location_name: locationName.trim() || null,
        registration_closes_at: toIsoOrNull(registrationClosesAt),
        entry_fee_minor: feeParse && feeParse.ok ? feeParse.minor : null,
        refund_policy: refundPolicy.trim() || null,
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
          location_name: locationName.trim() || null,
          registration_closes_at: toIsoOrNull(registrationClosesAt),
          entry_fee_minor: feeParse && feeParse.ok ? feeParse.minor : null,
          refund_policy: refundPolicy.trim() || null,
          created_by: authData.user.id,
        })
        .select("id")
        .single();

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
        <section className={`${CARD_PADDED} flex flex-col gap-space-5`}>
          <div className="flex flex-col gap-space-2">
            <label htmlFor={`${fieldId}-location`} className="text-label text-text-primary">
              Where is it fished?
            </label>
            <input
              id={`${fieldId}-location`}
              maxLength={160}
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
              className={INPUT}
              placeholder="Dana Point Harbor"
            />
            {/* Free text on purpose: an event is announced as "the Rockpile" long before
                anybody plots it, and demanding a coordinate would block publishing. */}
            <p className="text-caption text-text-muted">
              However you would say it out loud. This is what people see on the calendar.
            </p>
          </div>

          <div className="flex flex-col gap-space-2">
            <label htmlFor={`${fieldId}-fee`} className="text-label text-text-primary">
              What does it cost to enter?
            </label>
            <input
              id={`${fieldId}-fee`}
              inputMode="decimal"
              value={entryFee}
              onChange={(event) => setEntryFee(event.target.value)}
              className={INPUT}
              placeholder="250"
              aria-invalid={feeProblem ? true : undefined}
              aria-describedby={feeProblem ? `${fieldId}-fee-error` : undefined}
            />
            {feeProblem ? (
              <p id={`${fieldId}-fee-error`} role="alert" className="text-body text-error-red">
                {feeProblem}
              </p>
            ) : (
              <p className="text-caption text-text-muted">
                Leave it empty if you have not decided. Put 0 if it is free — that is a
                different thing, and the calendar says so.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-space-2">
            <label htmlFor={`${fieldId}-closes`} className="text-label text-text-primary">
              When do entries close?
            </label>
            <input
              id={`${fieldId}-closes`}
              type="datetime-local"
              value={registrationClosesAt}
              onChange={(event) => setRegistrationClosesAt(event.target.value)}
              className={INPUT}
            />
            {/* Deliberately allowed to fall after the start: dock registration on the
                morning of is normal, and the schema permits it for the same reason. */}
            <p className="text-caption text-text-muted">
              The calendar counts down to this. It is fine for it to be on the morning of,
              if you take entries at the dock.
            </p>
          </div>

          {/*
            Shown to every angler directly above the pay button (ADR 010 §4). It is the
            host's promise about the host's money, so the app collects it and repeats it
            rather than writing one — an event with none says so, which is also information.
          */}
          <div className="flex flex-col gap-space-2">
            <label htmlFor={`${fieldId}-refunds`} className="text-label text-text-primary">
              What happens if somebody withdraws, or you cancel?
            </label>
            <textarea
              id={`${fieldId}-refunds`}
              rows={4}
              maxLength={1000}
              value={refundPolicy}
              onChange={(event) => setRefundPolicy(event.target.value)}
              className={`${INPUT} h-auto`}
              placeholder="Full refund up to 48 hours before the start. If we cancel for weather, everything is refunded."
            />
            <p className="text-caption text-text-muted">
              Anglers read this before they pay. Leave it empty and the app will say you have
              not published one — it will not invent terms for you.
            </p>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
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

      {step === 3 ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-4`}>
          <div className="flex flex-col gap-space-2">
            <h2 className="text-h3 text-text-primary">{name.trim() || "Untitled tournament"}</h2>
            <p className="text-body text-text-muted">{formatSchedule(toIsoOrNull(startsAt), toIsoOrNull(endsAt))}</p>
            <p className="text-caption text-text-muted">
              {visibilityPresentation(visibility).label} · {visibilityPresentation(visibility).blurb}
            </p>
          </div>

          {/*
            The event card, as an angler will read it. Reviewing the name and the dates but
            not the three facts the calendar leads with would let somebody confirm an event
            without ever seeing that it has no location and no price.
          */}
          <dl className="flex flex-wrap gap-x-space-6 gap-y-space-3 border-t border-hairline pt-space-4">
            <div className="min-w-0">
              <dt className="text-caption text-text-muted">Where</dt>
              <dd className="text-body text-text-primary">
                {locationName.trim() || "Not announced"}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-text-muted">Entry</dt>
              <dd className={`text-body text-text-primary ${TABULAR}`}>
                {feeParse && feeParse.ok
                  ? feeParse.minor === 0
                    ? "Free to enter"
                    : (formatMoney(feeParse.minor, "USD") ?? "—")
                  : "Not priced"}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-text-muted">Entries close</dt>
              <dd className="text-body text-text-primary">
                {formatDateTime(toIsoOrNull(registrationClosesAt)) ?? "No deadline set"}
              </dd>
            </div>
            <div className="w-full">
              <dt className="text-caption text-text-muted">Refunds</dt>
              <dd className="text-body text-text-primary">
                {refundPolicy.trim() || "No policy published — the checkout will say so."}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-space-3 border-t border-hairline pt-space-4">
            <p className="text-label text-text-primary">What happens next</p>
            <ul className="flex flex-col gap-space-3">
              <CheckRow
                state="done"
                label="It is created as a draft"
                detail="Nobody can enter until you open registration, so nothing is public by accident."
              />
              <CheckRow
                state="pending"
                label="Four things get locked before it can go live"
                detail="Rules, how it is scored, what counts as proof of a catch, and where you can fish. The overview walks you through them."
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
            {step === 1
              ? "Fix the entry fee to carry on."
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
