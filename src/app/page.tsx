import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Status = { ok: boolean; detail: string };

async function checkSupabase(): Promise<Status> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("YOUR-PROJECT-REF")) {
    return { ok: false, detail: "Env vars not set yet — fill in .env.local" };
  }

  const supabase = await createClient();
  // A real GET (not head:true) so PostgREST's error body comes back.
  const { count, error } = await supabase
    .from("catches")
    .select("*", { count: "exact" })
    .limit(1);

  // PGRST205 = the API answered, it just has no `catches` table yet.
  if (error?.code === "PGRST205") {
    return { ok: true, detail: `${new URL(url).hostname} — no \`catches\` table yet` };
  }
  if (error) {
    return { ok: false, detail: `${error.code ?? "error"}: ${error.message}` };
  }
  return { ok: true, detail: `${new URL(url).hostname} — ${count ?? 0} catches logged` };
}

export default async function Home() {
  const status = await checkSupabase();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8 font-ui text-text-primary">
      <div className="text-center">
        <h1 className="text-h1 font-bold tracking-tight">Fish Log Book</h1>
        <p className="mt-2 text-caption text-text-muted">
          Read the tide, then build an honest fishing history.
        </p>
      </div>

      <Link
        href="/tides"
        className="inline-flex min-h-touch-floor items-center justify-center rounded-md border border-signal-orange bg-signal-orange px-6 py-3 text-label font-semibold text-ink-on-orange transition-colors hover:bg-signal-orange-pressed focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
      >
        Open tide chart
      </Link>

      <div className="w-full max-w-md rounded-md border border-hairline bg-surface p-5">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${status.ok ? "bg-success-green" : "bg-error-red"}`}
            aria-hidden
          />
          <span className="text-label">
            Supabase: {status.ok ? "connected" : "not connected"}
          </span>
        </div>
        <p className="mt-2 break-words text-caption text-text-muted">{status.detail}</p>
      </div>
    </main>
  );
}
