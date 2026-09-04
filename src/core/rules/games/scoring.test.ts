import { describe, expect, it } from "vitest";

import { SPECIES, speciesById } from "@/core/ontology/species";
import { POINT_TEMPLATES, captainsCupDefaults, fishCricketDefaults, makeTheCutDefaults } from "./modes";
import { awards, biggestFish, winningTeams } from "./results";
import { repeatValue, score, speciesMatches, type ScoringContext } from "./scoring";
import type { GameEvent, GameParticipant, GameRules } from "./types";
import vectors from "../vectors/games.json";

/** The real ontology, so a template naming a fish that does not exist fails here. */
const CTX: ScoringContext = {
  rollsUpTo: (id) => speciesById(id)?.rollsUpTo ?? null,
  isProtected: (id) => speciesById(id)?.takeStatus === "protected",
};

function player(id: string, over: Partial<GameParticipant> = {}): GameParticipant {
  return {
    id,
    session_id: "s1",
    display_name: id,
    color_key: "signal-orange",
    team_id: null,
    handicap_points: 0,
    is_host: false,
    claimed_user_id: null,
    joined_at: "2026-09-04T14:00:00.000Z",
    removed_at: null,
    ...over,
  };
}

let seq = 0;
function fish(participant: string, species: string | null, over: Partial<GameEvent> = {}): GameEvent {
  seq += 1;
  return {
    id: `e${seq}`,
    session_id: "s1",
    kind: "catch",
    participant_id: participant,
    round: 1,
    seq,
    created_at: `2026-09-04T14:${String(seq).padStart(2, "0")}:00.000Z`,
    species_id: species,
    species_other: null,
    length_mm: null,
    weight_g: null,
    disposition: "released",
    personal_best: false,
    new_species: false,
    catch_id: null,
    legal: null,
    voids_event_id: null,
    adjustment_points: null,
    note: null,
    approved: true,
    ...over,
  };
}

function control(over: Partial<GameEvent>): GameEvent {
  seq += 1;
  return fish("", null, { kind: "round_advanced", participant_id: null, seq, id: `c${seq}`, ...over });
}

/** Captain's Cup with the bonuses off, so a test asserts one thing at a time. */
function plainCup(over: Partial<GameRules> = {}): GameRules {
  const base = captainsCupDefaults();
  return {
    ...base,
    scoring: {
      ...base.scoring,
      bonuses: { first_blood: 0, new_species: 0, personal_best: 0, release: 0, biggest_of_round: 0 },
    },
    ...over,
  };
}

const pointsOf = (s: ReturnType<typeof score>, id: string) =>
  s.rows.find((r) => r.participant_id === id)?.points ?? null;

describe("repeatValue — vectors", () => {
  for (const v of vectors.repeatValue) {
    it(v.why, () => {
      expect(repeatValue(v.base, v.prior, v.rule as never)).toBe(v.expect);
    });
  }
});

describe("speciesMatches — vectors", () => {
  for (const v of vectors.speciesMatches) {
    it(v.why, () => {
      expect(speciesMatches(v.species, v.rule, CTX)).toBe(v.expect);
    });
  }
});

describe("point templates", () => {
  it("name only species the ontology actually has", () => {
    const known = new Set(SPECIES.map((s) => s.id));
    for (const template of POINT_TEMPLATES) {
      for (const tier of template.tiers) {
        expect(known, `${template.id} names "${tier.species_id}"`).toContain(tier.species_id);
      }
    }
  });

  it("never award points for a protected species", () => {
    for (const template of POINT_TEMPLATES) {
      for (const tier of template.tiers) {
        expect(speciesById(tier.species_id)?.takeStatus).not.toBe("protected");
      }
    }
  });
});

describe("Captain's Cup", () => {
  it("scores a fish at its tier", () => {
    const s = score(plainCup(), [player("a")], [fish("a", "yellowtail")], CTX);
    expect(pointsOf(s, "a")).toBe(5);
  });

  it("scores an unlisted eligible species at the default", () => {
    const s = score(plainCup(), [player("a")], [fish("a", "opaleye")], CTX);
    expect(pointsOf(s, "a")).toBe(1);
  });

  it("matches a group tier through roll-up", () => {
    const s = score(plainCup(), [player("a")], [fish("a", "vermilion_rockfish")], CTX);
    expect(pointsOf(s, "a")).toBe(3);
  });

  it("prefers an exact species tier over its group", () => {
    const rules = plainCup();
    const withExact: GameRules = {
      ...rules,
      scoring: {
        ...rules.scoring,
        tiers: [...rules.scoring.tiers, { species_id: "vermilion_rockfish", points: 7 }],
      },
    };
    const s = score(withExact, [player("a")], [fish("a", "vermilion_rockfish")], CTX);
    expect(pointsOf(s, "a")).toBe(7);
  });

  it("caps repeats of one species at three", () => {
    const s = score(
      plainCup(),
      [player("a")],
      [1, 2, 3, 4, 5].map(() => fish("a", "yellowtail")),
      CTX,
    );
    expect(pointsOf(s, "a")).toBe(15);
    expect(s.rows[0].scoring_catches).toBe(3);
    expect(s.rows[0].total_catches).toBe(5);
  });

  it("adds a handicap once, not per catch", () => {
    const s = score(
      plainCup(),
      [player("a", { handicap_points: 10 })],
      [fish("a", "yellowtail"), fish("a", "kelp_bass")],
      CTX,
    );
    expect(pointsOf(s, "a")).toBe(18);
  });

  it("pays the bonuses the founder asked for", () => {
    const s = score(
      captainsCupDefaults(),
      [player("a")],
      [fish("a", "yellowtail", { new_species: true, personal_best: true, disposition: "released" })],
      CTX,
    );
    // 5 tier + 2 first blood + 3 new species + 3 personal best + 1 release
    expect(pointsOf(s, "a")).toBe(14);
  });

  it("pays first blood exactly once in a game", () => {
    const s = score(
      captainsCupDefaults(),
      [player("a"), player("b")],
      [fish("a", "kelp_bass"), fish("b", "kelp_bass"), fish("a", "kelp_bass")],
      CTX,
    );
    const firstBlood = s.events.flatMap((e) => e.bonuses).filter((b) => b.kind === "first_blood");
    expect(firstBlood).toHaveLength(1);
  });
});

describe("the safeguards the game may never get wrong", () => {
  it("scores a protected species zero, and says so", () => {
    const protectedSpecies = SPECIES.find((s) => s.takeStatus === "protected");
    expect(protectedSpecies, "the ontology has a protected species to test with").toBeDefined();
    const s = score(plainCup(), [player("a")], [fish("a", protectedSpecies!.id)], CTX);
    expect(pointsOf(s, "a")).toBe(0);
    expect(s.events[0].status).toBe("zero_protected");
    expect(s.events[0].reason).toBeTruthy();
  });

  it("scores a fish kept against a release verdict zero", () => {
    const s = score(
      plainCup(),
      [player("a")],
      [
        fish("a", "yellowtail", {
          disposition: "kept",
          legal: {
            verdict: "release",
            reason: "Season closed today in this management area.",
            pack_id: "socal",
            pack_version: 3,
            protected_species: false,
          },
        }),
      ],
      CTX,
    );
    expect(pointsOf(s, "a")).toBe(0);
    expect(s.events[0].status).toBe("zero_illegal_retention");
  });

  it("pays a legal release in full — a fish never has to be killed to score", () => {
    const legal = {
      verdict: "keep" as const,
      reason: "Open season.",
      pack_id: "socal",
      pack_version: 3,
      protected_species: false,
    };
    const kept = score(plainCup(), [player("a")], [fish("a", "yellowtail", { disposition: "kept", legal })], CTX);
    const released = score(plainCup(), [player("a")], [fish("a", "yellowtail", { disposition: "released", legal })], CTX);
    expect(pointsOf(released, "a")).toBe(pointsOf(kept, "a"));
  });

  it("treats an unknown legal reading as unknown, not as prohibited", () => {
    const s = score(plainCup(), [player("a")], [fish("a", "yellowtail", { legal: null, disposition: "kept" })], CTX);
    expect(pointsOf(s, "a")).toBe(5);
  });

  it("gives an unresolved Quick Mark nothing until the species is named", () => {
    const s = score(plainCup(), [player("a")], [fish("a", null)], CTX);
    expect(pointsOf(s, "a")).toBe(0);
    expect(s.events[0].status).toBe("zero_unresolved");
  });

  it("scores nothing for a species outside the eligible list", () => {
    const rules = plainCup();
    const s = score(
      { ...rules, scoring: { ...rules.scoring, eligible_species: ["yellowtail"] } },
      [player("a")],
      [fish("a", "kelp_bass")],
      CTX,
    );
    expect(s.events[0].status).toBe("zero_not_eligible");
  });
});

describe("a catch cannot score twice", () => {
  it("folds a duplicated event id exactly once", () => {
    const one = fish("a", "yellowtail");
    const s = score(plainCup(), [player("a")], [one, { ...one }, { ...one, seq: one.seq + 50 }], CTX);
    expect(pointsOf(s, "a")).toBe(5);
    expect(s.rows[0].total_catches).toBe(1);
  });

  it("scores the same whatever order the events arrive in", () => {
    const events = [fish("a", "yellowtail"), fish("a", "kelp_bass"), fish("a", "dorado")];
    const forward = score(plainCup(), [player("a")], events, CTX);
    const backward = score(plainCup(), [player("a")], [...events].reverse(), CTX);
    expect(pointsOf(backward, "a")).toBe(pointsOf(forward, "a"));
  });

  it("orders by seq, not by the device clock", () => {
    const first = fish("a", "yellowtail", { created_at: "2030-01-01T00:00:00.000Z" });
    const second = fish("a", "kelp_bass", { created_at: "2001-01-01T00:00:00.000Z" });
    const s = score(plainCup(), [player("a")], [first, second], CTX);
    expect(s.events.map((e) => e.event.id)).toEqual([first.id, second.id]);
  });
});

describe("undo and correction", () => {
  it("takes back the points of a voided catch", () => {
    const caught = fish("a", "yellowtail");
    const undo = control({ kind: "void", voids_event_id: caught.id });
    const s = score(plainCup(), [player("a")], [caught, undo], CTX);
    expect(pointsOf(s, "a")).toBe(0);
    expect(s.events[0].status).toBe("voided");
  });

  it("keeps the voided catch in the record rather than deleting it", () => {
    const caught = fish("a", "yellowtail");
    const s = score(plainCup(), [player("a")], [caught, control({ kind: "void", voids_event_id: caught.id })], CTX);
    expect(s.events.some((e) => e.event.id === caught.id)).toBe(true);
    expect(s.rows[0].total_catches).toBe(1);
  });

  it("applies a host adjustment with its note", () => {
    const s = score(
      plainCup(),
      [player("a")],
      [fish("a", "yellowtail"), control({ kind: "adjustment", participant_id: "a", adjustment_points: -5, note: "Wrong angler." })],
      CTX,
    );
    expect(pointsOf(s, "a")).toBe(0);
  });

  it("holds a catch at zero while the captain has not approved it", () => {
    const rules: GameRules = { ...plainCup(), host_approval: true };
    const s = score(rules, [player("a")], [fish("a", "yellowtail", { approved: false })], CTX);
    expect(pointsOf(s, "a")).toBe(0);
    expect(s.events[0].status).toBe("pending_approval");
  });
});

describe("Fish Cricket", () => {
  const cricket = fishCricketDefaults();

  it("takes three marks to close a target, and the closing fish does not score", () => {
    const s = score(cricket, [player("a"), player("b")], [
      fish("a", "kelp_bass"),
      fish("a", "kelp_bass"),
      fish("a", "kelp_bass"),
    ], CTX);
    expect(s.rows.find((r) => r.participant_id === "a")?.marks.kelp_bass).toBe(3);
    expect(pointsOf(s, "a")).toBe(0);
  });

  it("scores on a closed target while an opponent still has it open", () => {
    const s = score(cricket, [player("a"), player("b")], [
      fish("a", "kelp_bass"),
      fish("a", "kelp_bass"),
      fish("a", "kelp_bass"),
      fish("a", "kelp_bass"),
    ], CTX);
    expect(pointsOf(s, "a")).toBe(3);
  });

  it("stops paying once every opponent has closed it too", () => {
    const s = score(cricket, [player("a"), player("b")], [
      fish("a", "kelp_bass"), fish("a", "kelp_bass"), fish("a", "kelp_bass"),
      fish("b", "kelp_bass"), fish("b", "kelp_bass"), fish("b", "kelp_bass"),
      fish("a", "kelp_bass"),
    ], CTX);
    expect(pointsOf(s, "a")).toBe(0);
  });

  it("counts a measured fish double toward closing", () => {
    const s = score(cricket, [player("a"), player("b")], [
      fish("a", "kelp_bass", { weight_g: 2000 }),
      fish("a", "kelp_bass", { weight_g: 2000 }),
    ], CTX);
    expect(s.rows.find((r) => r.participant_id === "a")?.marks.kelp_bass).toBe(3);
  });

  it("ignores a species that is not a target", () => {
    const s = score(cricket, [player("a"), player("b")], [fish("a", "pacific_mackerel")], CTX);
    expect(pointsOf(s, "a")).toBe(0);
  });
});

describe("Make the Cut", () => {
  const cut = makeTheCutDefaults();

  it("eliminates the lowest score when the captain closes the day", () => {
    const s = score(cut, [player("a"), player("b"), player("c")], [
      fish("a", "yellowtail"),
      fish("b", "kelp_bass"),
      control({}),
    ], CTX);
    expect(s.rows.find((r) => r.participant_id === "c")?.eliminated_round).toBe(1);
    expect(s.rows.find((r) => r.participant_id === "a")?.eliminated_round).toBeNull();
  });

  it("eliminates everyone tied at the bottom rather than picking one", () => {
    const s = score(cut, [player("a"), player("b"), player("c")], [
      fish("a", "yellowtail"),
      control({}),
    ], CTX);
    expect(s.rows.find((r) => r.participant_id === "b")?.eliminated_round).toBe(1);
    expect(s.rows.find((r) => r.participant_id === "c")?.eliminated_round).toBe(1);
  });

  it("resets scores between days when the rules say so", () => {
    const s = score(cut, [player("a"), player("b")], [
      fish("a", "yellowtail"),
      control({}),
      fish("a", "kelp_bass"),
    ], CTX);
    expect(pointsOf(s, "a")).toBe(3);
  });

  it("keeps logging an eliminated angler's fish, but stops scoring them", () => {
    const s = score(cut, [player("a"), player("b")], [
      fish("a", "yellowtail"),
      control({}),
      fish("b", "yellowtail"),
    ], CTX);
    const b = s.rows.find((r) => r.participant_id === "b");
    expect(b?.total_catches).toBe(1);
    expect(b?.points).toBe(0);
    expect(s.events[2].status).toBe("zero_eliminated");
  });

  it("never ranks an eliminated angler above one still fishing", () => {
    const s = score(cut, [player("a"), player("b"), player("c")], [
      fish("a", "yellowtail"),
      fish("b", "kelp_bass"),
      control({}),
    ], CTX);
    expect(s.rows[s.rows.length - 1].eliminated_round).not.toBeNull();
  });
});

describe("standings", () => {
  it("gives equal scores an equal rank", () => {
    const s = score(plainCup(), [player("a"), player("b")], [
      fish("a", "yellowtail"),
      fish("b", "yellowtail"),
    ], CTX);
    expect(s.rows.map((r) => r.rank)).toEqual([1, 1]);
  });

  /*
    Both anglers finish on exactly 5, so the tiebreaker is the only thing that can order
    them — and the same events must order differently under a different tiebreaker. An
    earlier version of this test had one angler ahead on points, which would have passed
    with the tiebreaker deleted entirely.
  */
  const tiedEvents = () => [
    fish("a", "yellowtail", { weight_g: 9000 }), // 5 points, one species, a big fish
    fish("b", "pacific_bonito"), // 3
    fish("b", "pacific_mackerel"), // 1
    fish("b", "opaleye"), // 1 — also 5, across three species, all unmeasured
  ];

  it("breaks a tie on unique species when the rules say so", () => {
    const s = score({ ...plainCup(), tiebreaker: "most_species" }, [player("a"), player("b")], tiedEvents(), CTX);
    expect(pointsOf(s, "a")).toBe(pointsOf(s, "b"));
    expect(s.rows[0].participant_id).toBe("b");
  });

  it("breaks the same tie the other way on biggest fish", () => {
    const s = score({ ...plainCup(), tiebreaker: "biggest_fish" }, [player("a"), player("b")], tiedEvents(), CTX);
    expect(pointsOf(s, "a")).toBe(pointsOf(s, "b"));
    expect(s.rows[0].participant_id).toBe("a");
  });

  it("totals a team from its members", () => {
    const s = score(plainCup(), [
      player("a", { team_id: "port" }),
      player("b", { team_id: "port" }),
      player("c", { team_id: "starboard" }),
    ], [fish("a", "yellowtail"), fish("b", "kelp_bass"), fish("c", "kelp_bass")], CTX);
    expect(s.teams.find((t) => t.team_id === "port")?.points).toBe(8);
    expect(s.teams[0].team_id).toBe("port");
  });

  it("ignores a player removed before the game began", () => {
    const s = score(plainCup(), [player("a"), player("b", { removed_at: "2026-09-04T13:00:00.000Z" })], [
      fish("b", "yellowtail"),
    ], CTX);
    expect(s.rows).toHaveLength(1);
    expect(s.events[0].status).toBe("voided");
  });

  it("reports a paused game as paused", () => {
    const s = score(plainCup(), [player("a")], [control({ kind: "paused" })], CTX);
    expect(s.paused).toBe(true);
    expect(score(plainCup(), [player("a")], [control({ kind: "paused" }), control({ kind: "resumed" })], CTX).paused).toBe(false);
  });
});

describe("end-of-game awards", () => {
  it("finds the biggest scoring fish by weight, then length", () => {
    const s = score(plainCup(), [player("a"), player("b")], [
      fish("a", "yellowtail", { weight_g: 5000, length_mm: 700 }),
      fish("b", "yellowtail", { weight_g: 5000, length_mm: 900 }),
      fish("a", "kelp_bass", { weight_g: 1000 }),
    ], CTX);
    expect(biggestFish(s)?.event.participant_id).toBe("b");
  });

  it("ignores a fish that scored nothing", () => {
    const s = score(plainCup(), [player("a"), player("b")], [
      fish("a", "yellowtail", { weight_g: 1000 }),
      fish("b", null, { weight_g: 99_000 }), // unresolved, so it never scored
    ], CTX);
    expect(biggestFish(s)?.event.participant_id).toBe("a");
  });

  it("has no biggest fish when nobody measured anything", () => {
    const s = score(plainCup(), [player("a")], [fish("a", "yellowtail")], CTX);
    expect(biggestFish(s)).toBeNull();
  });

  it("totals the released fish across everyone", () => {
    const s = score(plainCup(), [player("a"), player("b")], [
      fish("a", "yellowtail", { disposition: "released" }),
      fish("b", "kelp_bass", { disposition: "released" }),
      fish("b", "kelp_bass", { disposition: "kept" }),
    ], CTX);
    const released = awards(s, [player("a"), player("b")]).find((x) => x.kind === "released");
    expect(released?.detail).toBe("2 fish released");
  });

  it("names the angler with the most species", () => {
    const s = score(plainCup(), [player("a"), player("b")], [
      fish("a", "yellowtail"),
      fish("b", "kelp_bass"),
      fish("b", "opaleye"),
    ], CTX);
    const most = awards(s, [player("a"), player("b")]).find((x) => x.kind === "most_species");
    expect(most?.participant_id).toBe("b");
  });
});

describe("a round reset resets what the board shows, not the game's totals", () => {
  const cut = makeTheCutDefaults();

  it("clears the displayed counters alongside the score", () => {
    // The bug this pins: a day-2 board reading "1 fish · 1 species" beside a score of 0,
    // because the fish were yesterday's and the score was not. Caught on a real screen.
    const s = score(cut, [player("a"), player("b")], [
      fish("a", "yellowtail", { disposition: "released" }),
      fish("b", "kelp_bass"),
      control({}),
    ], CTX);
    const a = s.rows.find((r) => r.participant_id === "a");
    expect(a?.points).toBe(0);
    expect(a?.scoring_catches).toBe(0);
    expect(a?.unique_species).toEqual([]);
    expect(a?.released).toBe(0);
  });

  it("keeps the whole game's totals for the results screen", () => {
    const s = score(cut, [player("a"), player("b")], [
      fish("a", "yellowtail", { disposition: "released" }),
      fish("b", "kelp_bass"),
      control({}),
    ], CTX);
    const a = s.rows.find((r) => r.participant_id === "a");
    expect(a?.total_catches).toBe(1);
    expect(a?.total_species).toBe(1);
    expect(a?.total_released).toBe(1);
  });

  it("leaves both alone when scores carry between rounds", () => {
    const carry = { ...cut, rounds: { ...cut.rounds, carry_scores: true } };
    const s = score(carry, [player("a"), player("b")], [
      fish("a", "yellowtail"),
      fish("b", "kelp_bass"),
      control({}),
    ], CTX);
    const a = s.rows.find((r) => r.participant_id === "a");
    expect(a?.points).toBe(5);
    expect(a?.scoring_catches).toBe(1);
  });
});

describe("team games are won by a side, not a person", () => {
  const teamed = () => [
    player("a", { team_id: "Adults" }),
    player("b", { team_id: "Adults" }),
    player("c", { team_id: "Kids" }),
    player("d", { team_id: "Kids" }),
  ];

  it("names the winning team even when the top individual is on the losing side", () => {
    // Ruby out-fishes everyone, and still loses: two steady Adults beat one hot Kid.
    const s = score(plainCup(), teamed(), [
      fish("c", "bluefin_tuna"), // 8 — the biggest single score in the game
      fish("a", "yellowtail"), // 5
      fish("b", "yellowtail"), // 5 — Adults 10, Kids 8
    ], CTX);
    expect(s.rows[0].participant_id).toBe("c");
    expect(winningTeams(s)).toEqual(["Adults"]);
  });

  it("returns both sides on a genuine tie", () => {
    const s = score(plainCup(), teamed(), [
      fish("a", "yellowtail"),
      fish("c", "yellowtail"),
    ], CTX);
    expect(winningTeams(s)).toEqual(["Adults", "Kids"]);
  });

  it("returns nothing at all when the game had no teams", () => {
    const s = score(plainCup(), [player("a")], [fish("a", "yellowtail")], CTX);
    expect(winningTeams(s)).toEqual([]);
  });
});
