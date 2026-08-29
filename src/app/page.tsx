import { createClient } from "@/lib/supabase/server";
import { LearningGuideOverlay } from "@/features/learning/learning-dashboard";

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

export default async function Home({ searchParams }: PageProps<"/">) {
  const { guide } = await searchParams;
  const status = await checkSupabase();
  const guideActive = guide === "1";

  return (
    <main className="flex min-h-[calc(100dvh-68px)] flex-col items-center justify-center gap-8 bg-[#0A1014] p-8 text-[#EEF4F7]">
      <div className="text-center">
        <h1
          id="app-entry-title"
          className="text-4xl font-semibold tracking-tight outline-none"
          tabIndex={-1}
        >
          Fish Log Book
        </h1>
        <p className="mt-2 text-sm text-[#8CA0AC]">
          Working app entry · Next.js + Supabase
        </p>
      </div>

      <div
        className={`w-full max-w-md rounded-xl border bg-[#121A20] p-5 ${
          guideActive
            ? "border-[#FF7A18] ring-4 ring-[#FF7A18]/30"
            : "border-[#26333C]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${status.ok ? "bg-green-500" : "bg-red-500"}`}
            aria-hidden
          />
          <span className="font-medium">
            Supabase: {status.ok ? "connected" : "not connected"}
          </span>
        </div>
        <p className="mt-2 break-words text-sm text-[#8CA0AC]">
          {status.detail}
        </p>
      </div>
      {guideActive ? <LearningGuideOverlay /> : null}
    </main>
  );
}
