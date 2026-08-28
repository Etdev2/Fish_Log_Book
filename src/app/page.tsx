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
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Fish Log Book</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Next.js + Supabase
        </p>
      </div>

      <div className="w-full max-w-md rounded-lg border border-black/10 p-5 dark:border-white/15">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${status.ok ? "bg-green-500" : "bg-red-500"}`}
            aria-hidden
          />
          <span className="font-medium">
            Supabase: {status.ok ? "connected" : "not connected"}
          </span>
        </div>
        <p className="mt-2 break-words text-sm text-black/60 dark:text-white/60">
          {status.detail}
        </p>
      </div>
    </main>
  );
}
