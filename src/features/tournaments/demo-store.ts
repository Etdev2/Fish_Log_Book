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

const TOURNAMENTS_KEY = "fish-log-book:demo-tournaments";
const ENTRIES_KEY = "fish-log-book:demo-tournament-entries";

const SEED: DemoTournament[] = [
  {
    id: "demo-yellowtail-open",
    name: "Saturday Yellowtail Challenge",
    status: "REGISTRATION_OPEN",
    visibility: "PUBLIC",
    starts_at: "2026-09-12T14:00:00.000Z",
    ends_at: "2026-09-12T23:00:00.000Z",
    organization_id: "demo-personal-organization",
    active_rule_set_version_id: "demo-rules-v1",
    active_scoring_version_id: "demo-scoring-v1",
    active_verification_policy_version_id: null,
    active_boundary_version_id: null,
  },
];

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
  return [...stored, ...SEED.filter((seed) => !stored.some((item) => item.id === seed.id))];
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
