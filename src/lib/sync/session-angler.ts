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

/**
 * Call `onSession` whenever a session appears, now or later.
 *
 * The queue drains on a write, on `online`, and on the tab becoming visible — and none
 * of those is signing in. The real sequence is: log fish on the water with no signal,
 * come home, open the magic link, land back in the app already online and already
 * visible. Without this, everything caught that day stays queued until the angler
 * happens to background the tab, and the badge keeps saying "Saved on this device"
 * while a working server sits there waiting.
 *
 * Returns an unsubscribe, though the shell installs this once and keeps it for the
 * life of the tab.
 */
export function onAnglerSession(onSession: (id: string) => void): () => void {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return () => {};
  }
  try {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id;
      if (!id) return;
      rememberAnglerId(id);
      onSession(id);
    });
    return () => data.subscription.unsubscribe();
  } catch {
    return () => {};
  }
}
