import { parseFormat, type TournamentFormat } from "@/core/tournaments/formats";

/**
 * Where a format lives on a device with no tournament server.
 *
 * The production path is `save_tournament_format`, which appends a scoring version and
 * mirrors its categories; this is the same document written to `localStorage` so the
 * founder can build and run a whole tournament on a phone before Supabase is connected.
 * Both hand back the same `TournamentFormat`, and every screen reads it through
 * `use-format.ts` without knowing which one it got.
 */

const KEY = "fish-log-book:demo-tournament-format";

/**
 * Formats for the seeded demo events, so the three shapes a host can build are all visible
 * without creating anything: a multi-category offshore event, a species-points event, and a
 * plain heaviest-fish one. A format the founder saves over the top of these wins, because
 * stored values are read first.
 */
const SEED: Readonly<Record<string, TournamentFormat>> = {
  "demo-harbor-shootout": {
    currency: "USD",
    categories: [
      {
        id: "yellowtail",
        name: "Biggest yellowtail",
        family: "BIGGEST_FISH",
        species: ["yellowtail"],
        speciesPoints: {},
        bestN: null,
        payout: { model: "PLACES", split: [50, 30, 20] },
        entryFeeMinor: 25_000,
      },
      {
        id: "tuna",
        name: "Biggest tuna",
        family: "BIGGEST_FISH",
        species: ["bluefin_tuna", "yellowfin_tuna", "bigeye_tuna"],
        speciesPoints: {},
        bestN: null,
        payout: { model: "WINNER_TAKE_ALL", split: [] },
        entryFeeMinor: 25_000,
      },
      {
        id: "dorado",
        name: "Biggest dorado",
        family: "BIGGEST_FISH",
        species: ["dorado"],
        speciesPoints: {},
        bestN: null,
        payout: { model: "WINNER_TAKE_ALL", split: [] },
        entryFeeMinor: 10_000,
      },
    ],
  },
  "demo-yellowtail-open": {
    currency: "USD",
    categories: [
      {
        id: "points",
        name: "Points",
        family: "SPECIES_POINTS",
        species: [],
        speciesPoints: { yellowtail: 8, white_seabass: 8, kelp_bass: 2, pacific_bonito: 1, pacific_barracuda: 1 },
        bestN: null,
        payout: { model: "WINNER_TAKE_ALL", split: [] },
        entryFeeMinor: null,
      },
    ],
  },
  "demo-crew-cup": {
    currency: "USD",
    categories: [
      {
        id: "overall",
        name: "Heaviest fish",
        family: "BIGGEST_FISH",
        species: [],
        speciesPoints: {},
        bestN: null,
        payout: { model: "NONE", split: [] },
        entryFeeMinor: null,
      },
    ],
  },
};

function readAll(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function getDemoFormat(tournamentId: string): TournamentFormat | null {
  return parseFormat(readAll()[tournamentId]) ?? SEED[tournamentId] ?? null;
}

export function saveDemoFormat(tournamentId: string, format: TournamentFormat): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[tournamentId] = format;
  window.localStorage.setItem(KEY, JSON.stringify(all));
}
