import { describe, expect, it } from "vitest";

import { captainsCupDefaults } from "./modes";
import { score, type ScoringContext } from "./scoring";
import type { GameEvent, GameParticipant } from "./types";

const CTX: ScoringContext = {
  rollsUpTo: () => null,
  isProtected: () => false,
};

function participant(over: Partial<GameParticipant> = {}): GameParticipant {
  return {
    id: "p1",
    session_id: "s1",
    display_name: "Guest Angler",
    color_key: "signal-orange",
    team_id: null,
    handicap_points: 0,
    is_host: false,
    claimed_user_id: null,
    joined_at: "2026-09-05T08:00:00.000Z",
    removed_at: null,
    ...over,
  };
}

function event(over: Partial<GameEvent> = {}): GameEvent {
  return {
    id: "evt-1",
    session_id: "s1",
    kind: "catch",
    participant_id: "p1",
    round: 1,
    seq: 1,
    created_at: "2026-09-05T08:01:00.000Z",
    species_id: "yellowtail",
    species_other: null,
    length_mm: 700,
    weight_g: 5000,
    disposition: "released",
    personal_best: false,
    new_species: false,
    catch_id: null,
    legal: {
      verdict: "keep",
      reason: "Open season snapshot.",
      pack_id: "socal",
      pack_version: 7,
      protected_species: false,
    },
    voids_event_id: null,
    adjustment_points: null,
    note: null,
    approved: true,
    ...over,
  };
}

const rules = () => {
  const base = captainsCupDefaults();
  return {
    ...base,
    scoring: {
      ...base.scoring,
      bonuses: {
        first_blood: 0,
        new_species: 0,
        personal_best: 0,
        release: 0,
        biggest_of_round: 0,
      },
    },
  };
};

describe("Fish Games migration guardrails", () => {
  it("deduplicates a replayed event id before scoring", () => {
    const source = event();
    const standings = score(rules(), [participant()], [source, { ...source, seq: 99 }], CTX);

    expect(standings.events).toHaveLength(1);
    expect(standings.rows[0].total_catches).toBe(1);
  });

  it("uses monotonic sequence order instead of editable device time", () => {
    const laterClock = event({ id: "evt-a", seq: 1, created_at: "2035-01-01T00:00:00.000Z" });
    const earlierClock = event({ id: "evt-b", seq: 2, created_at: "2000-01-01T00:00:00.000Z" });

    const standings = score(rules(), [participant()], [earlierClock, laterClock], CTX);

    expect(standings.events.map((item) => item.event.id)).toEqual(["evt-a", "evt-b"]);
  });

  it("keeps source catch and void events in history while removing the score", () => {
    const caught = event();
    const undo = event({
      id: "evt-void",
      kind: "void",
      participant_id: null,
      species_id: null,
      seq: 2,
      voids_event_id: caught.id,
      legal: null,
    });

    const standings = score(rules(), [participant()], [caught, undo], CTX);

    expect(standings.events.map((item) => item.event.id)).toEqual([caught.id, undo.id]);
    expect(standings.rows[0].points).toBe(0);
    expect(standings.events[0].status).toBe("voided");
  });

  it("does not mutate the frozen Fish Legal snapshot while scoring", () => {
    const caught = event();
    const before = structuredClone(caught.legal);

    score(rules(), [participant()], [caught], CTX);

    expect(caught.legal).toEqual(before);
    expect(caught.legal?.pack_version).toBe(7);
  });

  it("preserves guest identity semantics independently of scoring", () => {
    const guest = participant({ claimed_user_id: null });
    const claimed = participant({ claimed_user_id: "user-123" });
    const caught = event();

    const guestScore = score(rules(), [guest], [caught], CTX);
    const claimedScore = score(rules(), [claimed], [caught], CTX);

    expect(guestScore.rows[0].points).toBe(claimedScore.rows[0].points);
    expect(guest.claimed_user_id).toBeNull();
    expect(claimed.claimed_user_id).toBe("user-123");
  });

  it("is deterministic when the same immutable inputs are scored repeatedly", () => {
    const inputParticipant = participant();
    const inputEvents = [event(), event({ id: "evt-2", seq: 2, species_id: "kelp_bass" })];

    const first = score(rules(), [inputParticipant], inputEvents, CTX);
    const second = score(rules(), [inputParticipant], inputEvents, CTX);

    expect(second).toEqual(first);
  });
});
