import { createClient } from "@/lib/supabase/client";

/**
 * Infrastructure diagnostics, not domain data — this is the one thing on /settings that is
 * allowed to touch the network, because "can this device reach the backend at all" is a
 * question about the device, not about the angler's rows (ADR 005 §4).
 */
export type Diagnostics =
  | { kind: "unconfigured"; detail: string }
  | { kind: "reachable"; detail: string }
  | { kind: "unreachable"; detail: string };

export async function checkBackend(): Promise<Diagnostics> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("YOUR-PROJECT-REF")) {
    return { kind: "unconfigured", detail: "Supabase environment variables are not set." };
  }

  const host = new URL(url).hostname;
  const supabase = createClient();
  const { error } = await supabase.from("trip").select("id").limit(1);

  // PGRST205 means PostgREST answered a real schema lookup: the key is good, the table is
  // simply not there yet. That is a reachable backend, not a broken one.
  if (!error || error.code === "PGRST205") {
    return {
      kind: "reachable",
      detail: error ? `${host} — schema not applied yet` : `${host} — schema applied`,
    };
  }

  return { kind: "unreachable", detail: `${host} — ${error.code ?? "error"}: ${error.message}` };
}
