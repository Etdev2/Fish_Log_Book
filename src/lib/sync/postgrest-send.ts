/**
 * PostgREST sender for one outbox mutation. Lives in `lib/` so `core/sync` stays I/O-free.
 */
import type { Mutation, SendOutcome } from "@/core/sync/outbox";
import { classifyHttp } from "@/core/sync/http-outcome";
import { createClient } from "@/lib/supabase/client";

const TABLES = new Set([
  "trip",
  "trip_rig",
  "catch",
  "catch_gear",
  "condition_snapshot",
  "location_condition",
  "journal_entry",
  "spot",
  "tackle_item",
]);

export async function sendViaPostgrest(mutation: Mutation): Promise<SendOutcome> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { kind: "unreachable", error: "supabase not configured" };
  }
  if (!TABLES.has(mutation.entity)) {
    return { kind: "rejected", error: `unknown entity ${mutation.entity}` };
  }

  try {
    const supabase = createClient();
    const table = mutation.entity;
    let status = 0;
    let code: string | null = null;
    let message: string | null = null;

    if (mutation.op === "insert") {
      const { error } = await supabase.from(table).insert(mutation.payload);
      if (!error) return { kind: "ok" };
      status = (error as { status?: number }).status ?? 400;
      code = error.code ?? null;
      message = error.message;
    } else if (mutation.op === "patch") {
      const { error } = await supabase.from(table).update(mutation.payload).eq("id", mutation.entityId);
      if (!error) return { kind: "ok" };
      status = (error as { status?: number }).status ?? 400;
      code = error.code ?? null;
      message = error.message;
    } else {
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: mutation.clientUpdatedAt, client_updated_at: mutation.clientUpdatedAt })
        .eq("id", mutation.entityId);
      if (!error) return { kind: "ok" };
      status = (error as { status?: number }).status ?? 400;
      code = error.code ?? null;
      message = error.message;
    }

    return classifyHttp(status, mutation.op, { code, message });
  } catch (err) {
    const message = err instanceof Error ? err.message : "network";
    return { kind: "unreachable", error: message };
  }
}
