import { NextResponse, type NextRequest } from "next/server";

import { callbackErrorReason } from "@/lib/supabase/callback-error";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges the code from a magic link or a Google sign-in for a session cookie, then
 * drops the angler on the calendar. Route handlers exist for what a browser must not do;
 * this is one of them.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Supabase sends `error` instead of `code` when sign-in fails: a cancel on Google's
  // screen, an expired email link, or a provider problem. Each gets its own message.
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/sign-in?error=${callbackErrorReason(searchParams)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=exchange_failed`);
  }

  return NextResponse.redirect(origin);
}
