"use client";

import { describeBackupState, readBackupState } from "../queries/backup-state";

/**
 * The quiet backup indicator (ADR 004 §6). Never says "failed" while retries remain,
 * never blocks anything, never shows a spinner.
 */
export function BackupBadge() {
  const state = readBackupState();
  const label = describeBackupState(state);

  const dot =
    state.kind === "needs-attention"
      ? "bg-amber-flag"
      : state.kind === "waiting"
        ? "bg-text-muted"
        : "bg-success-green";

  return (
    <p className="flex items-center gap-2 text-caption text-text-muted">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </p>
  );
}
