# Dev auth bypass

A local-only escape hatch in `src/proxy.ts` that skips the sign-in redirect so you can
work in the product without a magic-link round trip on every reload.

## Turn it on

1. In `.env.local`, add:
   ```
   DEV_AUTH_BYPASS=true
   ```
2. Run `next dev` (not `next build && next start`).
3. Load `/`. You land on the calendar directly. The server logs a loud
   `[DEV_AUTH_BYPASS]` warning on every request while it's active — that warning is the
   reminder that it's on.

## Turn it off (restore normal sign-in)

Remove the line from `.env.local`, or set `DEV_AUTH_BYPASS=false` / anything other than
the literal string `true`. The very next request redirects unauthenticated visitors to
`/sign-in` again, with no other change needed.

## Why it cannot reach production

The bypass requires **both**:

- `process.env.NODE_ENV !== "production"` — Next.js hard-codes `NODE_ENV` to
  `"production"` at build time for `next build`. It is baked into the compiled output,
  not a runtime value an operator could flip on a deployed instance.
- `DEV_AUTH_BYPASS === "true"` — an explicit opt-in, so plain `next dev` still requires
  signing in unless you turn this on yourself.

Because the first condition is fixed at build time to `"production"` for any deployed
build, setting `DEV_AUTH_BYPASS=true` in a production environment's variables has no
effect — the code path is unreachable there regardless.

When the bypass is off (the default), behavior is unchanged from before it existed:
unauthenticated requests to product routes still redirect to `/sign-in`.
