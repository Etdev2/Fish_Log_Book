/**
 * Map an HTTP/PostgREST result onto the outbox `SendOutcome` (sync-protocol.md §4).
 * Pure: the sender in `lib/` classifies, then `applyOutcome` advances state.
 */
import type { MutationOp, SendOutcome } from "./outbox";

export function classifyHttp(
  status: number,
  op: MutationOp,
  detail?: { code?: string | null; message?: string | null },
): SendOutcome {
  const message = detail?.message?.trim() || `HTTP ${status}`;
  const code = detail?.code ?? "";

  if (status >= 200 && status < 300) return { kind: "ok" };

  // Unique violation / PostgREST duplicate: the row already landed.
  if (op === "insert" && (status === 409 || code === "23505" || code === "PGRST116")) {
    return { kind: "duplicate" };
  }

  if (status === 401 || status === 403) {
    return { kind: "auth_expired", error: message };
  }

  if (status === 0 || status === 408 || status === 429 || status >= 500) {
    return { kind: "unreachable", error: message };
  }

  if (status >= 400 && status < 500) {
    return { kind: "rejected", error: message };
  }

  return { kind: "unreachable", error: message };
}
