"use client";

import { useEffect } from "react";

import { useLog } from "@/features/catches/store";
import { installFlushListeners } from "@/lib/sync/run-flush";

import { describeBackupState, fromOutboxBackup } from "../queries/backup-state";

/**
 * The quiet backup indicator (ADR 004 §6). Never says "failed" while retries remain,
 * never blocks anything, never shows a spinner.
 */
export function BackupBadge() {
  const log = useLog();
  useEffect(() => {
    installFlushListeners();
  }, []);
  const state = fromOutboxBackup(log.backup, Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));
  const label = describeBackupState(state);

  // Green is earned only by `settled` — the server actually has the data. Local-only is
  // deliberately the same quiet grey as "waiting": a small dot, never a success signal.
  const dot =
    state.kind === "needs-attention"
      ? "bg-amber-flag"
      : state.kind === "settled"
        ? "bg-success-green"
        : "bg-text-muted";

  return (
    <p className="flex items-center gap-2 text-caption text-text-muted">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </p>
  );
}
