import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ENTITY_STORES, LOCAL_STORES } from "@/lib/offline/db";

/**
 * The architectural invariants from ADR 009, pinned at the level where a regression would
 * actually be introduced — someone reaching for the catch store because it is right there
 * and already has a species field.
 *
 * These are source-level assertions rather than behavioural ones on purpose. The behaviour
 * was verified in a real browser (Chromium at 320px: after a guest logs a bluefin, the
 * `catch` store holds 0 rows, the outbox holds 0, and `game_event` holds 1). But that check
 * needs a browser and this suite has no DOM, and the invariant is too important to rest on
 * a test somebody has to remember to run by hand. What is checked here is the thing that
 * would break it.
 */

const GAMES_DIR = "src/features/games";

function sourceFiles(dir: string): readonly string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts")) out.push(path);
  }
  return out;
}

describe("guest catches never become catch rows (ADR 009 §1)", () => {
  const files = sourceFiles(GAMES_DIR);

  it("has source files to check, so a rename cannot silently pass this suite", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("never writes to the catch store from anywhere in Boat Games", () => {
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      // `commit` is the row-plus-outbox write path for syncable entities. Boat Games uses
      // `commitLocal`. Importing the other one is how a game catch would become a catch.
      expect(text, `${file} imports the syncable write path`).not.toMatch(
        /\bimport\s*\{[^}]*\bcommit\b[^}]*\}\s*from\s*["']@\/lib\/offline\/db["']/,
      );
      expect(text, `${file} names the catch store in a write`).not.toMatch(
        /store:\s*["']catch["']/,
      );
    }
  });

  it("never imports the Fish Log's write actions", () => {
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, `${file} reaches into the catch store`).not.toMatch(
        /from\s*["']@\/features\/catches\/(store|create)["']/,
      );
    }
  });
});

describe("game stores stay out of the outbox (ADR 009 §2)", () => {
  it("shares no store between the syncable set and the device-local set", () => {
    const syncable = new Set<string>(ENTITY_STORES);
    for (const local of LOCAL_STORES) {
      // A store in both lists would be queued for a Supabase table that does not exist,
      // and every mutation would come back 4xx and sit in `rejected` — a permanent
      // "needs attention" badge on the angler's phone for a feature working perfectly.
      expect(syncable.has(local), `${local} is in both sets`).toBe(false);
    }
  });

  it("covers every store Boat Games writes to", () => {
    expect([...LOCAL_STORES].sort()).toEqual([
      "crew_member",
      "game_event",
      "game_participant",
      "game_session",
    ]);
  });
});
