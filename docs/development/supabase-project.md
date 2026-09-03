# Point the app at a real Supabase project

The flusher will not say “Backed up” until three things exist: a project, applied
migrations, and a signed-in session. `DEV_AUTH_BYPASS` skips the gate; it does **not**
mint a JWT, so it cannot prove a row landed.

## 1. Create the project

In the [Supabase dashboard](https://supabase.com/dashboard): New project. Region close
to you. Copy **Project URL** and **anon public** key (Settings → API).

Put them in `.env.local` (never commit the file):

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

Do **not** put the service role key in the web app.

## 2. Apply migrations

From the repo root, with the [Supabase CLI](https://supabase.com/docs/guides/cli)
logged in and linked (`supabase link --project-ref YOUR-PROJECT-REF`):

```
supabase db push
```

That applies everything under `supabase/migrations/`, including
`20260903120000_v1_angler_signup_and_catch_extras.sql` (angler row on signup, catch
extras the web log already writes).

Auth: enable Email (magic link) under Authentication → Providers. Set the Site URL
and redirect allow-list to your origin plus `/callback`.

## 3. Field-test the outbox

1. `npm run dev` with **no** `DEV_AUTH_BYPASS`.
2. Sign in at `/sign-in`.
3. Airplane mode. Tap the mark.
4. Come back online. Badge should move from “N waiting to back up” to “Backed up”.
5. Table editor: `catch` (and `trip`) rows with `angler_id = auth.users.id`.

If the badge stays waiting, open the network tab: 401 = session, 409 duplicate is
success, 400 with `PGRST204` is a column the allowlist missed.
