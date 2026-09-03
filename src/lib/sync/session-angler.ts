/**
 * The signed-in angler id, cached so a write on a boat with no radio still stamps
 * auth.uid() rather than the prototype placeholder.
 */
import { createClient } from "@/lib/supabase/client";

export const LOCAL_ANGLER_ID = "00000000-0000-7000-8000-000000000001";

const KEY = "fish-log-angler-id";

export function cachedAnglerId(): string {
  if (typeof localStorage === "undefined") return LOCAL_ANGLER_ID;
  try {
    return localStorage.getItem(KEY) ?? LOCAL_ANGLER_ID;
  } catch {
    return LOCAL_ANGLER_ID;
  }
}

export function rememberAnglerId(id: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* private mode */
  }
}

/** Pull the session into localStorage. Safe to call from the shell on every paint. */
export async function bindSessionAngler(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id ?? null;
    if (id) rememberAnglerId(id);
    return id;
  } catch {
    return null;
  }
}
