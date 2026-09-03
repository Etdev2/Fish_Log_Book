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
 * Maps the outbox `BackupState` onto the badge vocabulary. "Backed up" is only
 * earned when a server is configured *and* the queue is empty.
 */
import type { BackupState as OutboxBackup } from "@/core/sync/outbox";

export type BackupState =
  | { kind: "local-only" }
  | { kind: "settled" }
  | { kind: "waiting"; count: number }
  | { kind: "needs-attention"; count: number };

export function fromOutboxBackup(outbox: OutboxBackup, serverConfigured: boolean): BackupState {
  if (outbox.kind === "needs_attention") return { kind: "needs-attention", count: outbox.count };
  if (outbox.kind === "waiting") return { kind: "waiting", count: outbox.count };
  return serverConfigured ? { kind: "settled" } : { kind: "local-only" };
}

export function readBackupState(): BackupState {
  return { kind: "local-only" };
}

export function describeBackupState(state: BackupState): string {
  switch (state.kind) {
    case "local-only":
      return "Saved on this device";
    case "settled":
      return "Backed up";
    case "waiting":
      return `${state.count} waiting to back up`;
    case "needs-attention":
      return `${state.count} needs a look`;
  }
}
