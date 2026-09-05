import { describe, expect, it } from "vitest";

import { TOURNAMENT_STATUSES } from "@/core/tournaments/lifecycle";
import {
  countdown,
  entrySteps,
  formatDuration,
  formatSchedule,
  statusPresentation,
  syncPresentation,
  TONE_CLASSES,
  tournamentPhase,
} from "./format";

/**
 * These cover the two things that actually go wrong in a presentation layer: a state the
 * table forgot (so a screen prints `REGISTRATION_OPEN` at a human), and a clock that
 * disagrees with the status line printed next to it.
 */

describe("statusPresentation", () => {
  it("has a human label, a tone, and an explanation for every lifecycle state", () => {
    for (const status of TOURNAMENT_STATUSES) {
      const presentation = statusPresentation(status);
      expect(presentation.label, status).not.toMatch(/_/);
      expect(presentation.label, status).not.toBe(status);
      expect(presentation.blurb.length, status).toBeGreaterThan(0);
      expect(TONE_CLASSES[presentation.tone], status).toBeDefined();
    }
  });

  it("falls back to title case rather than blanking on an unknown state", () => {
    expect(statusPresentation("SOME_NEW_STATE").label).toBe("Some New State");
    expect(statusPresentation("SOME_NEW_STATE").tone).toBe("neutral");
  });
});

describe("tournamentPhase", () => {
  it("sorts every state into before, during, or after", () => {
    expect(tournamentPhase("DRAFT")).toBe("before");
    expect(tournamentPhase("READY")).toBe("before");
    expect(tournamentPhase("LIVE")).toBe("during");
    expect(tournamentPhase("PAUSED")).toBe("during");
    expect(tournamentPhase("RESULTS_PENDING")).toBe("after");
    expect(tournamentPhase("FINAL")).toBe("after");
  });
});

describe("formatDuration", () => {
  it("stops at two units and rounds down", () => {
    expect(formatDuration(30_000)).toBe("under a minute");
    expect(formatDuration(42 * 60_000)).toBe("42m");
    expect(formatDuration(5 * 3_600_000 + 12 * 60_000)).toBe("5h 12m");
    expect(formatDuration(3 * 3_600_000)).toBe("3h");
    expect(formatDuration(2 * 86_400_000 + 3 * 3_600_000)).toBe("2 days 3h");
    expect(formatDuration(86_400_000)).toBe("1 day");
  });

  it("drops the hours once the number of days is big enough that they do not matter", () => {
    expect(formatDuration(9 * 86_400_000 + 5 * 3_600_000)).toBe("9 days");
  });
});

describe("countdown", () => {
  const now = Date.parse("2026-09-12T12:00:00.000Z");

  it("counts down to the start before the event", () => {
    expect(
      countdown(now, {
        status: "REGISTRATION_OPEN",
        startsAt: "2026-09-18T12:00:00.000Z",
        endsAt: null,
      }),
    ).toEqual({ label: "Starts in 6 days", urgent: false });
  });

  it("marks the last day before the start as urgent", () => {
    const result = countdown(now, {
      status: "READY",
      startsAt: "2026-09-12T17:00:00.000Z",
      endsAt: null,
    });
    expect(result).toEqual({ label: "Starts in 5h", urgent: true });
  });

  it("counts down to lines-out once the tournament is live", () => {
    expect(
      countdown(now, {
        status: "LIVE",
        startsAt: "2026-09-12T07:00:00.000Z",
        endsAt: "2026-09-12T16:30:00.000Z",
      }),
    ).toEqual({ label: "4h 30m left", urgent: true });
  });

  it("never counts down inside a window the director has not started", () => {
    // The scheduled window is open, but the state says entries are still being taken.
    // A "4h left" pill here would contradict the status pill beside it.
    expect(
      countdown(now, {
        status: "REGISTRATION_OPEN",
        startsAt: "2026-09-12T07:00:00.000Z",
        endsAt: "2026-09-12T16:30:00.000Z",
      }),
    ).toEqual({ label: "Start time has passed", urgent: false });
  });

  it("stops the clock for finished, paused, and cancelled tournaments", () => {
    const schedule = { startsAt: "2026-09-12T07:00:00.000Z", endsAt: "2026-09-12T16:30:00.000Z" };
    expect(countdown(now, { status: "PAUSED", ...schedule })?.label).toBe("Paused");
    expect(countdown(now, { status: "FINAL", ...schedule })?.label).toBe("Official");
    expect(countdown(now, { status: "CANCELLED", ...schedule })).toBeNull();
  });
});

describe("formatSchedule", () => {
  it("does not print the same date twice for a one-day event", () => {
    const schedule = formatSchedule("2026-09-12T14:00:00.000Z", "2026-09-12T23:00:00.000Z");
    expect(schedule).toContain("–");
    expect(schedule.match(/Sep/g) ?? []).toHaveLength(1);
  });

  it("says so plainly when nothing is scheduled", () => {
    expect(formatSchedule(null, null)).toBe("Date not set yet");
  });
});

describe("entrySteps", () => {
  it("keeps the four entry states separate, each with its own next step", () => {
    const steps = entrySteps({
      registration_status: "PENDING",
      eligibility_status: "UNKNOWN",
      check_in_status: "NOT_CHECKED_IN",
      competition_status: "NOT_STARTED",
    });

    expect(steps).toHaveLength(4);
    expect(steps.map((item) => item.value)).toEqual([
      "Submitted",
      "Not checked yet",
      "Not checked in",
      "Not started",
    ]);
    for (const item of steps) expect(item.hint.length).toBeGreaterThan(0);
  });
});

describe("syncPresentation", () => {
  it("never implies the server has a catch it has not confirmed", () => {
    expect(syncPresentation("SAVED_OFFLINE").label).toBe("Saved on this phone");
    expect(syncPresentation("PENDING_SYNC").label).toBe("Waiting to send");
    expect(syncPresentation("SYNCED").label).toBe("Received by the scorer");
    expect(syncPresentation("CONFLICT").tone).toBe("stopped");
  });
});
