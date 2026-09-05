import { getDemoEntry } from "./demo-store";
import type { FieldEntry } from "./field";

/**
 * The demo field: a tournament with real boats in it.
 *
 * The point of this file is that the roster, the board, the organizer's counts and the
 * catch screen are all reading the *same* people. Before it existed the leaderboard had
 * three invented names in it and no other screen had any, so nothing added up — which is
 * the first thing anybody notices when they are being shown a product.
 *
 * Everything here is fictional and local to the device. Real fields come from
 * `tournament_entry` joined to `tournament_team` / `tournament_boat`; this file has the
 * same shape so the screens do not care which one they were handed.
 */

const CHECK_IN_KEY = "fish-log-book:demo-tournament-check-in";

/**
 * A mid-size offshore event: fourteen boats, one of them yours, a couple still waiting on
 * the organizer, one waitlisted, and half of them already on the board. Big enough that
 * the roster's search box earns its place, which is the honest test of the screen.
 */
const HARBOR_SHOOTOUT: readonly FieldEntry[] = [
  row("hs-1", "12", "M. Rivera", "Reel Deal", "Miss Ellie", { weight: 28.6, species: "Yellowtail", checkedIn: true }),
  row("hs-2", "7", "J. Park", null, "Second Wind", { weight: 24.2, species: "Yellowtail", checkedIn: true }),
  row("hs-3", "22", "A. Lewis", "Bluewater", "Bluewater", { weight: 21.9, species: "White seabass", checkedIn: true, awaitingReview: true }),
  row("hs-4", "3", "D. Okafor", null, "Salt Habit", { weight: 19.4, species: "Yellowtail", checkedIn: true }),
  row("hs-5", "18", "You", null, "Nauti Buoy", { weight: null, species: null, checkedIn: true, isYou: true }),
  row("hs-6", "9", "T. Nguyen", null, "Calico Kid", { weight: 8.1, species: "Calico bass", checkedIn: true }),
  row("hs-7", "14", "R. Delgado", "Tuna Tango", "Tuna Tango", { weight: 17.8, species: "Yellowtail", checkedIn: true }),
  row("hs-8", "5", "K. Mbeki", null, "Grey Ghost", { weight: null, species: null, checkedIn: true }),
  row("hs-9", "27", "S. Whitfield", "Knot Working", "Knot Working", { weight: 11.3, species: "Bonito", checkedIn: true }),
  row("hs-10", "31", "P. Andersen", null, "Fintastic", { weight: null, species: null, checkedIn: true }),
  row("hs-11", "8", "L. Moreau", null, "Wave Dancer", { weight: 6.9, species: "Barracuda", checkedIn: true }),
  row("hs-12", "40", "C. Ferreira", "Hook, Line", "Sinker", { weight: null, species: null, checkedIn: false, registration: "PENDING", eligibility: "PENDING_REVIEW" }),
  row("hs-13", "—", "B. Osei", null, "Late Entry", { weight: null, species: null, checkedIn: false, registration: "WAITLISTED" }),
  row("hs-14", "16", "H. Tanaka", null, "Kuroshio", { weight: null, species: null, checkedIn: false, registration: "WITHDRAWN" }),
];

/** A friend event that has not started: nobody scored, nobody checked in yet. */
const YELLOWTAIL_OPEN: readonly FieldEntry[] = [
  row("yt-1", "1", "M. Rivera", null, "Miss Ellie", { weight: null, species: null, checkedIn: false }),
  row("yt-2", "2", "T. Nguyen", null, "Calico Kid", { weight: null, species: null, checkedIn: false }),
  row("yt-3", "3", "S. Whitfield", null, null, { weight: null, species: null, checkedIn: false, registration: "PENDING" }),
  row("yt-4", "4", "D. Okafor", null, "Salt Habit", { weight: null, species: null, checkedIn: false }),
  row("yt-5", "5", "L. Moreau", null, null, { weight: null, species: null, checkedIn: false, eligibility: "PENDING_REVIEW" }),
];

/** A finished family event. Everything settled, everybody scored. */
const CREW_CUP: readonly FieldEntry[] = [
  row("cc-1", "1", "Sam", null, null, { weight: 17.2, species: "Lingcod", checkedIn: true, competition: "FINISHED" }),
  row("cc-2", "2", "Dad", null, null, { weight: 15.8, species: "Lingcod", checkedIn: true, competition: "FINISHED" }),
  row("cc-3", "3", "Ellie", null, null, { weight: 6.4, species: "Rockfish", checkedIn: true, competition: "FINISHED" }),
  row("cc-4", "4", "You", null, null, { weight: 12.1, species: "Cabezon", checkedIn: true, competition: "FINISHED", isYou: true }),
];

const FIELDS: Readonly<Record<string, readonly FieldEntry[]>> = {
  "demo-harbor-shootout": HARBOR_SHOOTOUT,
  "demo-yellowtail-open": YELLOWTAIL_OPEN,
  "demo-crew-cup": CREW_CUP,
};

function row(
  entryId: string,
  entryNumber: string,
  displayName: string,
  teamName: string | null,
  boatName: string | null,
  options: {
    weight: number | null;
    species: string | null;
    checkedIn: boolean;
    isYou?: boolean;
    awaitingReview?: boolean;
    registration?: string;
    eligibility?: string;
    competition?: string;
  },
): FieldEntry {
  return {
    entryId,
    entryNumber: entryNumber === "—" ? null : entryNumber,
    displayName,
    teamName,
    boatName,
    registrationStatus: options.registration ?? "CONFIRMED",
    eligibilityStatus: options.eligibility ?? "ELIGIBLE",
    checkInStatus: options.checkedIn ? "CHECKED_IN" : "NOT_CHECKED_IN",
    competitionStatus: options.competition ?? (options.checkedIn ? "ACTIVE" : "NOT_STARTED"),
    isYou: options.isYou ?? false,
    bestWeightLb: options.weight,
    species: options.species,
    awaitingReview: options.awaitingReview ?? false,
  };
}

function readOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CHECK_IN_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Check-in is the one thing on the roster a director actually changes during a demo, so it
 * persists. Everything else about a demo entry is fixed — inventing a way to fake an
 * eligibility decision would teach the wrong thing about who gets to make one.
 */
export function getDemoField(tournamentId: string): readonly FieldEntry[] {
  const overrides = readOverrides();
  const base = withYourEntry(tournamentId, FIELDS[tournamentId] ?? []);
  return base.map((entry) => {
    const override = overrides[`${tournamentId}:${entry.entryId}`];
    if (!override) return entry;
    return {
      ...entry,
      checkInStatus: override,
      // Being on the water is what makes an entry active; the two move together at the
      // ramp, and a roster that shows "checked in / not started" is just confusing.
      competitionStatus:
        override === "CHECKED_IN" && entry.competitionStatus === "NOT_STARTED"
          ? "ACTIVE"
          : entry.competitionStatus,
    };
  });
}

/**
 * If you have entered this tournament on this device, you are in the field.
 *
 * Without this, entering a tournament and then opening "Who's in" shows everybody except
 * you, which is the single most obvious way for a demo to look broken. Seeded events that
 * already carry a "You" row are left alone.
 */
function withYourEntry(tournamentId: string, base: readonly FieldEntry[]): readonly FieldEntry[] {
  if (base.some((entry) => entry.isYou)) return base;

  const yours = getDemoEntry(tournamentId);
  if (!yours) return base;

  return [
    ...base,
    {
      entryId: yours.id,
      entryNumber: base.length > 0 ? String(base.length + 1) : "1",
      displayName: yours.display_name,
      teamName: null,
      boatName: null,
      registrationStatus: yours.registration_status,
      eligibilityStatus: yours.eligibility_status,
      checkInStatus: yours.check_in_status,
      competitionStatus: yours.competition_status,
      isYou: true,
      bestWeightLb: null,
      species: null,
      awaitingReview: false,
    },
  ];
}

export function setDemoCheckIn(tournamentId: string, entryId: string, status: string): void {
  if (typeof window === "undefined") return;
  const overrides = readOverrides();
  overrides[`${tournamentId}:${entryId}`] = status;
  window.localStorage.setItem(CHECK_IN_KEY, JSON.stringify(overrides));
}

