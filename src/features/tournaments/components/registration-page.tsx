"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BackLink } from "@/components/back-link";
import {
  buildOrder,
  canCheckOut,
  crewProblems,
  orphanedDivisionIds,
  type CrewMember,
  type EventOption,
} from "@/core/tournaments/registration";

import { registerDemoEntry } from "../demo-store";
import { registrationState } from "../event-card";
import { useDivisions } from "../queries/use-divisions";
import { useEvents } from "../queries/use-events";
import { useNow } from "../use-now";
import { CARD_PADDED, INSET, PAGE } from "../ui-classes";
import { CheckoutPanel } from "./checkout-panel";
import { CrewSection } from "./crew-section";
import { EventSelection } from "./event-selection";
import { DemoNote, ErrorScreen, LoadingScreen } from "./tournament-chrome";

/**
 * The registration form: who is fishing, what you are entering, and paying for all of it.
 *
 * One screen, in the order a person actually decides: the boat, then the events and the
 * jackpots, then the money. The founder's brief is explicit that this is where several
 * events are chosen at once and where payment happens, and ADR 010 §1 makes that one order
 * — so the total at the bottom covers everything ticked above it and one payment settles
 * the lot.
 *
 * You arrive from an event, so that event starts ticked. Every other event still open for
 * entries is listed under it, because "while I am here, put me in Saturday's as well" is
 * the reason somebody would want a multi-event form at all.
 *
 * Nothing is registered until the payment confirms. That is not a UI convention, it is
 * `paymentCanActivateRegistration`, and the checkout's "confirming" state exists so the
 * screen cannot quietly pretend otherwise while a transaction is still in flight.
 */
export function RegistrationPage({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const { load, retry } = useEvents();
  const now = useNow();
  const nowMs = now === null ? 0 : Number(now);

  const [crew, setCrew] = useState<readonly CrewMember[]>([
    { id: "crew-1", displayName: "", email: null, phone: null, isCaptain: true },
  ]);
  const [eventIds, setEventIds] = useState<readonly string[]>([tournamentId]);
  const [divisionIds, setDivisionIds] = useState<readonly string[]>([]);
  const [policyAcknowledged, setPolicyAcknowledged] = useState(false);

  /* Only events still taking entries can be added. Offering a closed one and refusing it at
     checkout would waste the one decision the screen is asking for. */
  const enterable = useMemo(() => {
    if (load.state !== "ready") return [];
    return load.events.filter((event) => {
      const kind = registrationState(event, nowMs).kind;
      return event.id === tournamentId || kind === "open" || kind === "open-no-deadline";
    });
  }, [load, nowMs, tournamentId]);

  /*
    Jackpots come from a loader now rather than straight out of the demo seed. Read from the
    seed, they were invisible against a real database — no error, no empty state, just no
    jackpot section on any event, which is the founder's headline feature quietly absent.
  */
  const divisions = useDivisions(useMemo(() => enterable.map((event) => event.id), [enterable]));

  const options: EventOption[] = useMemo(
    () =>
      enterable.map((event) => ({
        id: event.id,
        name: event.name,
        entryFeeMinor: event.entry_fee_minor,
        currency: event.currency,
        divisions:
          divisions.state === "ready" ? (divisions.byTournament.get(event.id) ?? []) : [],
      })),
    [enterable, divisions],
  );

  const selection = useMemo(() => ({ eventIds, divisionIds }), [eventIds, divisionIds]);
  const build = useMemo(() => buildOrder(options, selection), [options, selection]);
  const problems = useMemo(() => crewProblems(crew), [crew]);

  const arrivedFrom = options.find((option) => option.id === tournamentId);
  /* One policy per event on the order — see the note in `checkout-panel.tsx`. It comes off
     the event itself now, so a host who writes one actually has it shown. */
  const refundPolicies = useMemo(
    () =>
      enterable
        .filter((event) => eventIds.includes(event.id))
        .map((event) => ({
          eventId: event.id,
          eventName: event.name,
          policy: event.refund_policy,
        })),
    [enterable, eventIds],
  );

  if (load.state === "loading") return <LoadingScreen label="Loading registration" />;
  if (load.state === "error") {
    return (
      <ErrorScreen
        title="Registration did not load"
        message={`${load.message} Everything else in the app still works — this is the tournament connection only.`}
        onRetry={retry}
      />
    );
  }

  const toggleEvent = (id: string) => {
    const next = eventIds.includes(id) ? eventIds.filter((each) => each !== id) : [...eventIds, id];
    setEventIds(next);
    // Untick jackpots that belonged to an event that has just been removed, so the bill and
    // the ticks can never disagree.
    const orphans = new Set(orphanedDivisionIds(options, { eventIds: next, divisionIds }));
    if (orphans.size > 0) setDivisionIds(divisionIds.filter((each) => !orphans.has(each)));
  };

  const toggleDivision = (id: string) =>
    setDivisionIds(
      divisionIds.includes(id) ? divisionIds.filter((each) => each !== id) : [...divisionIds, id],
    );

  const ready = canCheckOut({ crew, build, refundPolicyAcknowledged: policyAcknowledged });

  return (
    <div className={PAGE}>
      <BackLink
        href={`/tournaments/${tournamentId}/overview`}
        label={arrivedFrom?.name ?? "Event"}
      />

      <header className="flex flex-col gap-space-2">
        <h1 className="text-h1 text-text-primary">Register</h1>
        <p className="text-body text-text-muted">
          Add your crew, tick every event and jackpot you want, and pay for all of it in one
          go.
        </p>
      </header>

      <CrewSection crew={crew} problems={problems} onChange={setCrew} disabled={false} />

      <EventSelection
        events={options}
        selectedEventIds={eventIds}
        selectedDivisionIds={divisionIds}
        onToggleEvent={toggleEvent}
        onToggleDivision={toggleDivision}
        unpricedEventIds={build.unpricedEventIds}
        disabled={false}
      />

      {build.problem === "mixed-currency" ? (
        <p className={`${INSET} text-body text-amber-flag`} role="alert">
          These events are priced in different currencies, so they cannot be paid for
          together. Register for them separately.
        </p>
      ) : null}

      <label className={`${CARD_PADDED} flex cursor-pointer items-start gap-space-3`}>
        <input
          type="checkbox"
          checked={policyAcknowledged}
          onChange={(event) => setPolicyAcknowledged(event.target.checked)}
          className="mt-space-1 size-space-5 shrink-0 accent-signal-orange"
        />
        <span className="text-body text-text-primary">
          I have read the refund policy below and the event&rsquo;s rules.
        </span>
      </label>

      {build.draft ? (
        <CheckoutPanel
          orderId={`order-${tournamentId}-${eventIds.length}-${divisionIds.length}`}
          draft={build.draft}
          refundPolicies={refundPolicies}
          ready={ready}
          blockedReason={blockedReason({ problems: problems.length, policyAcknowledged })}
          onPaid={() => {
            // Demo mode has no server to write to, so the entry is recorded on the device.
            // The real write lands with the tournament backend; the rule that only a
            // confirmed payment gets here is already enforced above.
            const captain = crew.find((member) => member.isCaptain);
            for (const id of eventIds) {
              registerDemoEntry(id, captain?.displayName.trim() || "My boat");
            }
            router.push("/tournaments/mine");
          }}
        />
      ) : (
        <p className="text-body text-text-muted">Tick at least one event to see the total.</p>
      )}

      {load.demo ? <DemoNote /> : null}
    </div>
  );
}

/** Says what is still missing, so a disabled pay button is never a mystery. */
function blockedReason(input: { problems: number; policyAcknowledged: boolean }): string | null {
  if (input.problems > 0) return "Finish the crew details above before paying.";
  if (!input.policyAcknowledged) return "Tick the box above to confirm you have read the policy.";
  return null;
}
