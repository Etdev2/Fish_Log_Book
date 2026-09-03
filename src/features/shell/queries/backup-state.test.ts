import { describe, expect, it } from "vitest";

import { describeBackupState, fromOutboxBackup, readBackupState } from "./backup-state";

/*
 * ADR 004 §6 fixes this vocabulary deliberately: "Saved" and "Backed up" are different
 * states, offline is not an error, and nothing says "failed" while retries remain. The
 * words are the contract, so they are tested like one.
 */
describe("backup state vocabulary", () => {
  it("never uses failure language for a queued write", () => {
    const waiting = describeBackupState({ kind: "waiting", count: 3 });
    expect(waiting).toBe("3 waiting to back up");
    expect(waiting.toLowerCase()).not.toContain("fail");
    expect(waiting.toLowerCase()).not.toContain("error");
  });

  it("says backed up only when it is on the server", () => {
    expect(describeBackupState({ kind: "settled" })).toBe("Backed up");
  });

  it("says saved on this device — never backed up — before anything has synced", () => {
    expect(describeBackupState({ kind: "local-only" })).toBe("Saved on this device");
    expect(readBackupState().kind).toBe("local-only");
    expect(fromOutboxBackup({ kind: "backed_up" }, false).kind).toBe("local-only");
    expect(fromOutboxBackup({ kind: "backed_up" }, true).kind).toBe("settled");
    expect(fromOutboxBackup({ kind: "waiting", count: 2 }, true)).toEqual({
      kind: "waiting",
      count: 2,
    });
  });

  it("uses the agreed words for the one state allowed to interrupt", () => {
    expect(describeBackupState({ kind: "needs-attention", count: 1 })).toContain(
      "needs a look",
    );
  });
});
