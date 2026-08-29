import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh (ADR 005 §5). In Next 16 the `middleware` convention is renamed `proxy`
 * — node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
 *
 * This is one of only three places allowed to import @supabase/* outside a feature's query
 * layer, alongside src/lib/supabase/** and src/app/(auth)/**. It refreshes the auth cookie
 * and nothing else: it reads no domain data, and it must not, because every screen renders
 * from the local store (ADR 004 §1).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touching getUser() is what performs the refresh. Do not remove it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * The auth gate lives here, not in (app)/layout.tsx.
   *
   * ADR 005 §5 asks for both a server-side gate and product routes that stay static — and
   * a cookie read inside a layout makes every route below it dynamic, which puts a network
   * round trip in front of the first paint and quietly breaks the offline story the same
   * ADR is built on. The proxy runs before render and can redirect without costing the
   * route its static prerender, so it satisfies both halves.
   */
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname === "/sign-in" || pathname === "/callback";
  const isInternal = pathname.startsWith("/learn");

  /*
   * DEV_AUTH_BYPASS — local-only escape hatch so the founder can work in the product
   * without a magic-link round trip on every reload.
   *
   * Server-only var (no NEXT_PUBLIC_ prefix): the proxy is the only consumer, and a
   * NEXT_PUBLIC_ var gets inlined into client bundles for every build, dev or not, which
   * is a strictly worse place for this to leak from. A server-only var is fine here
   * because the proxy always runs on the server.
   *
   * Belt and braces against this ever reaching production:
   *   1. `process.env.NODE_ENV !== "production"` — Next.js hard-codes NODE_ENV at build
   *      time for a production build (`next build`); it is not a runtime env var an
   *      operator could flip on a deployed instance.
   *   2. The explicit opt-in `DEV_AUTH_BYPASS === "true"` — so plain `next dev` still
   *      requires signing in, and nobody disables auth for the whole team by accident.
   * Both conditions must hold. When either is false, behavior below is byte-identical
   * to what it was before this bypass existed.
   */
  const devAuthBypass =
    process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true";

  if (devAuthBypass) {
    console.warn(
      "[DEV_AUTH_BYPASS] Auth gate is disabled for local development. Unset DEV_AUTH_BYPASS (or leave it unset) to restore normal sign-in.",
    );
  }

  if (!user && !isAuthRoute && !isInternal && !devAuthBypass) {
    const signIn = request.nextUrl.clone();
    signIn.pathname = "/sign-in";
    return NextResponse.redirect(signIn);
  }

  if (user && pathname === "/sign-in") {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    return NextResponse.redirect(home);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files. The auth routes are deliberately
     * included: a signed-in angler hitting /sign-in should carry a fresh session.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
