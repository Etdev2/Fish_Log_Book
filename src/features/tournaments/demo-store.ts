export type DemoTournament = {
  id: string;
  name: string;
  status: string;
  visibility: string;
  starts_at: string | null;
  ends_at: string | null;
  organization_id: string;
  active_rule_set_version_id: string | null;
  active_scoring_version_id: string | null;
  active_verification_policy_version_id: string | null;
  active_boundary_version_id: string | null;
};

export type DemoEntry = {
  id: string;
  tournament_id: string;
  registration_status: string;
  eligibility_status: string;
  check_in_status: string;
  competition_status: string;
  display_name: string;
};

/** A public-safe standings row: exactly the fields `core/tournaments/public-projection` allows. */
export type DemoStanding = {
  rank: number;
  display_name: string;
  species: string;
  weight_lb: number;
  /** Official once every review behind it is closed; provisional until then. */
  official: boolean;
};

const TOURNAMENTS_KEY = "fish-log-book:demo-tournaments";
const ENTRIES_KEY = "fish-log-book:demo-tournament-entries";

/**
 * Demo tournaments are dated relative to now rather than pinned to fixed timestamps.
 *
 * The old seed started on 12 September 2026 and would have been a stale "started 4 months
 * ago" event by the new year — which quietly breaks the one thing the seed exists to show,
 * a tournament with a live clock running. Relative dates keep the demo honest for as long
 * as the file lives. They are only ever read from an effect, so there is no server render
 * for the moving value to disagree with.
 */
function at(dayOffset: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

/** Rounded to the quarter hour, because "8:05 PM – 3:38 AM" reads like a machine wrote it. */
function minutesFromNow(minutes: number): string {
  const quarter = 15 * 60_000;
  return new Date(Math.round((Date.now() + minutes * 60_000) / quarter) * quarter).toISOString();
}

/**
 * Three tournaments, chosen so every state the UI has to render appears in the demo
 * without the founder having to create one: an event taking entries with its setup
 * half-finished, an event being fished right now, and one that is over and official.
 */
function seedTournaments(): DemoTournament[] {
  return [
    {
      id: "demo-harbor-shootout",
      name: "Harbor Bay Shootout",
      status: "LIVE",
      visibility: "PUBLIC",
      starts_at: minutesFromNow(-185),
      ends_at: minutesFromNow(268),
      organization_id: "demo-personal-organization",
      active_rule_set_version_id: "demo-rules-v3",
      active_scoring_version_id: "demo-scoring-v2",
      active_verification_policy_version_id: "demo-verification-v1",
      active_boundary_version_id: "demo-boundary-v1",
    },
    {
      id: "demo-yellowtail-open",
      name: "Saturday Yellowtail Challenge",
      status: "REGISTRATION_OPEN",
      visibility: "PUBLIC",
      starts_at: at(6, 7),
      ends_at: at(6, 16),
      organization_id: "demo-personal-organization",
      active_rule_set_version_id: "demo-rules-v1",
      active_scoring_version_id: "demo-scoring-v1",
      active_verification_policy_version_id: null,
      active_boundary_version_id: null,
    },
    {
      id: "demo-crew-cup",
      name: "Crew Cup",
      status: "FINAL",
      visibility: "PRIVATE",
      starts_at: at(-9, 6),
      ends_at: at(-9, 15),
      organization_id: "demo-personal-organization",
      active_rule_set_version_id: "demo-rules-v1",
      active_scoring_version_id: "demo-scoring-v1",
      active_verification_policy_version_id: "demo-verification-v1",
      active_boundary_version_id: "demo-boundary-v1",
    },
  ];
}

const SEED_STANDINGS: Readonly<Record<string, readonly DemoStanding[]>> = {
  "demo-harbor-shootout": [
    { rank: 1, display_name: "M. Rivera", species: "Yellowtail", weight_lb: 28.6, official: true },
    { rank: 2, display_name: "J. Park", species: "Yellowtail", weight_lb: 24.2, official: true },
    { rank: 3, display_name: "A. Lewis", species: "White seabass", weight_lb: 21.9, official: false },
    { rank: 4, display_name: "D. Okafor", species: "Yellowtail", weight_lb: 19.4, official: true },
    { rank: 5, display_name: "T. Nguyen", species: "Calico bass", weight_lb: 8.1, official: true },
  ],
  "demo-crew-cup": [
    { rank: 1, display_name: "Sam", species: "Lingcod", weight_lb: 17.2, official: true },
    { rank: 2, display_name: "Dad", species: "Lingcod", weight_lb: 15.8, official: true },
    { rank: 3, display_name: "Ellie", species: "Rockfish", weight_lb: 6.4, official: true },
  ],
};

export function hasSupabaseBrowserConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getDemoTournaments(): DemoTournament[] {
  const stored = readJson<DemoTournament[]>(TOURNAMENTS_KEY, []);
  const seed = seedTournaments();
  return [...stored, ...seed.filter((item) => !stored.some((own) => own.id === item.id))];
}

export function getDemoTournament(id: string): DemoTournament | null {
  return getDemoTournaments().find((item) => item.id === id) ?? null;
}

export function createDemoTournament(input: {
  name: string;
  visibility: string;
  starts_at: string | null;
  ends_at: string | null;
}): DemoTournament {
  const item: DemoTournament = {
    id: `demo-${Date.now()}`,
    name: input.name,
    status: "DRAFT",
    visibility: input.visibility,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    organization_id: "demo-personal-organization",
    active_rule_set_version_id: null,
    active_scoring_version_id: null,
    active_verification_policy_version_id: null,
    active_boundary_version_id: null,
  };
  const stored = readJson<DemoTournament[]>(TOURNAMENTS_KEY, []);
  writeJson(TOURNAMENTS_KEY, [item, ...stored]);
  return item;
}

export function getDemoEntry(tournamentId: string): DemoEntry | null {
  return readJson<DemoEntry[]>(ENTRIES_KEY, []).find((item) => item.tournament_id === tournamentId) ?? null;
}

export function registerDemoEntry(tournamentId: string, displayName: string): DemoEntry {
  const existing = getDemoEntry(tournamentId);
  if (existing) return existing;

  const entry: DemoEntry = {
    id: `demo-entry-${Date.now()}`,
    tournament_id: tournamentId,
    registration_status: "PENDING",
    eligibility_status: "UNKNOWN",
    check_in_status: "NOT_CHECKED_IN",
    competition_status: "NOT_STARTED",
    display_name: displayName,
  };
  const entries = readJson<DemoEntry[]>(ENTRIES_KEY, []);
  writeJson(ENTRIES_KEY, [entry, ...entries]);
  return entry;
}

/**
 * Standings for the seeded demo events only. A tournament the founder creates has no
 * standings, and inventing some would teach the wrong thing about where scores come from —
 * the empty leaderboard with "nothing has been scored yet" is the honest screen.
 */
export function getDemoStandings(tournamentId: string): readonly DemoStanding[] {
  return SEED_STANDINGS[tournamentId] ?? [];
}
