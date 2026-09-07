import { computeOrderTotal, type OrderItemInput } from "./payments";

/**
 * Turning "who is on the boat and what are we entering" into an order.
 *
 * This is the arithmetic and the rules behind the registration form, kept pure so the
 * numbers can be tested without a browser, a wallet, or a card. Every decision that costs
 * somebody money is made here; the screens only render it.
 *
 * The shape follows ADR 010 §1: **one order, many items.** An angler entering three events
 * and two jackpots produces one order with five line items and one total, not five orders.
 * That is what lets the checkout be a single payment, and it is what makes partial failure
 * impossible — an order either activates entirely or not at all.
 */

/** Someone on the boat. The captain is one of these, flagged. */
export interface CrewMember {
  readonly id: string;
  readonly displayName: string;
  readonly email: string | null;
  /** Day-of contact. Required for the captain — see ADR 010 §4. */
  readonly phone: string | null;
  readonly isCaptain: boolean;
}

/** Something you can buy into inside an event: a jackpot, a side pot, a paid division. */
export interface DivisionOption {
  readonly id: string;
  readonly name: string;
  /** The host's own words about what this pot pays for. */
  readonly description: string | null;
  readonly kind: "DIVISION" | "JACKPOT" | "SIDE_POT";
  /** Null means included in the base entry — not the same as costing zero. */
  readonly entryFeeMinor: number | null;
  /** What the pot holds right now, for the "$4,200, 34 in" line at the point of choice. */
  readonly poolMinor: number | null;
  readonly participantCount: number | null;
}

export interface EventOption {
  readonly id: string;
  readonly name: string;
  readonly entryFeeMinor: number | null;
  readonly currency: string;
  readonly divisions: readonly DivisionOption[];
}

/** What the angler has chosen: events, and per event which divisions they bought into. */
export interface RegistrationSelection {
  readonly eventIds: readonly string[];
  /** Division ids, flat. A division belongs to exactly one event, so no nesting is needed. */
  readonly divisionIds: readonly string[];
}

export interface OrderLine extends OrderItemInput {
  /** Stable id for React keys and for matching a line back to what was chosen. */
  readonly referenceId: string;
  readonly description: string;
  readonly totalAmountMinor: number;
}

export interface OrderDraft {
  readonly lines: readonly OrderLine[];
  readonly totalMinor: number;
  readonly currency: string;
}

/**
 * The order an angler's choices add up to.
 *
 * Rules that are easy to get wrong and are therefore stated once, here:
 *
 * - **An event with no price is not free.** A null `entryFeeMinor` means the host has not
 *   priced it; it produces no line, and `unpricedEventIds` reports it so the screen can
 *   say so rather than charging zero and implying the entry is settled.
 * - **A division whose fee is null is included in the entry.** It is selectable and it
 *   costs nothing extra, so it produces no line.
 * - **A division is only billable if its event was selected.** Selecting a jackpot and
 *   then removing the event must not leave the jackpot on the bill.
 * - **Mixed currencies are refused, not converted.** Two events priced in different
 *   currencies cannot honestly share one total, and guessing a rate here would put an
 *   invented exchange rate inside somebody's entry fee.
 */
export interface OrderBuildResult {
  readonly draft: OrderDraft | null;
  /** Selected events the host has not priced. They enter; there is nothing to charge. */
  readonly unpricedEventIds: readonly string[];
  /** Set when the selection cannot become one order at all. */
  readonly problem: "no-events" | "mixed-currency" | null;
}

export function buildOrder(
  events: readonly EventOption[],
  selection: RegistrationSelection,
): OrderBuildResult {
  const chosen = events.filter((event) => selection.eventIds.includes(event.id));
  if (chosen.length === 0) {
    return { draft: null, unpricedEventIds: [], problem: "no-events" };
  }

  const currencies = new Set(chosen.map((event) => event.currency.toUpperCase()));
  if (currencies.size > 1) {
    return { draft: null, unpricedEventIds: [], problem: "mixed-currency" };
  }
  const currency = [...currencies][0];

  const lines: OrderLine[] = [];
  const unpriced: string[] = [];

  for (const event of chosen) {
    if (event.entryFeeMinor === null) {
      unpriced.push(event.id);
    } else {
      lines.push({
        referenceId: event.id,
        itemType: "TOURNAMENT_ENTRY",
        description: event.name,
        quantity: 1,
        unitAmountMinor: event.entryFeeMinor,
        totalAmountMinor: event.entryFeeMinor,
      });
    }

    for (const division of event.divisions) {
      if (!selection.divisionIds.includes(division.id)) continue;
      if (division.entryFeeMinor === null) continue; // included in the entry
      lines.push({
        referenceId: division.id,
        itemType: division.kind === "SIDE_POT" ? "SIDE_POT" : "JACKPOT",
        description: `${event.name} — ${division.name}`,
        quantity: 1,
        unitAmountMinor: division.entryFeeMinor,
        totalAmountMinor: division.entryFeeMinor,
      });
    }
  }

  return {
    draft: { lines, totalMinor: computeOrderTotal(lines), currency },
    unpricedEventIds: unpriced,
    problem: null,
  };
}

/**
 * Divisions the angler picked that no longer belong to a chosen event.
 *
 * The form has to prune these rather than merely ignore them at billing time: a jackpot
 * left visibly ticked under a removed event is a promise the total is not keeping.
 */
export function orphanedDivisionIds(
  events: readonly EventOption[],
  selection: RegistrationSelection,
): readonly string[] {
  const live = new Set(
    events
      .filter((event) => selection.eventIds.includes(event.id))
      .flatMap((event) => event.divisions.map((division) => division.id)),
  );
  return selection.divisionIds.filter((id) => !live.has(id));
}

export type CrewProblem =
  | { readonly kind: "no-captain" }
  | { readonly kind: "many-captains" }
  | { readonly kind: "captain-no-phone" }
  | { readonly kind: "blank-name"; readonly memberId: string };

/**
 * Whether this crew can be registered.
 *
 * Exactly one captain, and that captain must be reachable by phone (ADR 010 §4). Everything
 * else about a crew is the host's business, not the schema's — a boat of one is a valid
 * entry, and so is a boat of eight.
 */
export function crewProblems(crew: readonly CrewMember[]): readonly CrewProblem[] {
  const problems: CrewProblem[] = [];
  const captains = crew.filter((member) => member.isCaptain);

  if (captains.length === 0) problems.push({ kind: "no-captain" });
  if (captains.length > 1) problems.push({ kind: "many-captains" });
  if (captains.length === 1 && !hasPhone(captains[0])) problems.push({ kind: "captain-no-phone" });

  for (const member of crew) {
    if (member.displayName.trim().length === 0) {
      problems.push({ kind: "blank-name", memberId: member.id });
    }
  }
  return problems;
}

function hasPhone(member: CrewMember): boolean {
  // Deliberately not a format check. Phone numbers are international, people write them
  // with spaces and words in them, and rejecting a number a host can actually dial in
  // order to enforce a pattern is the wrong trade. Digits present is the whole test.
  return (member.phone ?? "").replace(/\D/g, "").length >= 7;
}

/** Whether the whole registration is ready to be paid for. */
export function canCheckOut(input: {
  readonly crew: readonly CrewMember[];
  readonly build: OrderBuildResult;
  /** The host's refund policy has to be on screen before the pay button — ADR 010 §4. */
  readonly refundPolicyAcknowledged: boolean;
}): boolean {
  if (crewProblems(input.crew).length > 0) return false;
  if (input.build.problem !== null) return false;
  if (input.build.draft === null) return false;
  // A zero total is legitimate — a free event with no paid jackpots — and still needs the
  // policy acknowledged, because withdrawal rules apply to free entries too.
  return input.refundPolicyAcknowledged;
}
