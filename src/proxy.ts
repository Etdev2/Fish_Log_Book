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

  if (!user && !isAuthRoute && !isInternal) {
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
