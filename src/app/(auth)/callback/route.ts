import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges the code from a magic link or a Google sign-in for a session cookie, then
 * drops the angler on the calendar. Route handlers exist for what a browser must not do;
 * this is one of them.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Supabase sends `error` instead of `code` when the angler backs out of Google's screen.
  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/sign-in?error=cancelled`);
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
