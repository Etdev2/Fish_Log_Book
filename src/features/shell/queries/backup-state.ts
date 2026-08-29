/**
 * The backup indicator's data seam (ADR 004 §6).
 *
 * Vocabulary is non-negotiable and lives here so every surface says the same thing:
 *   in the outbox   -> "Saved"       (nothing loud; a quiet count at most)
 *   on the server   -> "Backed up"
 *   conflicted      -> the only state allowed to interrupt the angler
 *
 * Offline is a normal state, not an error. An angler is offline for six hours by design.
 * There is no red banner here and there never will be.
 *
 * TODO(ADR 004 §1): read the real count from the outbox store once src/core/sync/store.ts
 * exists. Until then this reports a settled state rather than inventing a number.
 */
export type BackupState =
  | { kind: "settled" }
  | { kind: "waiting"; count: number }
  | { kind: "needs-attention"; count: number };

export function readBackupState(): BackupState {
  return { kind: "settled" };
}

export function describeBackupState(state: BackupState): string {
  switch (state.kind) {
    case "settled":
      return "Backed up";
    case "waiting":
      return `${state.count} waiting to back up`;
    case "needs-attention":
      return `${state.count} needs a look`;
  }
}
