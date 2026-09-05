# Point the app at a real Supabase project

The flusher will not say “Backed up” until three things exist: a project, applied
migrations, and a signed-in session. `DEV_AUTH_BYPASS` skips the gate; it does **not**
mint a JWT, so it cannot prove a row landed.

## 1. Create the project

In the [Supabase dashboard](https://supabase.com/dashboard): New project. Region close
to you. Copy **Project URL** and **anon public** key (Settings → API).

Put them in `.env.local` (never commit the file). Write it with a quoted heredoc rather
than pasting the block into a shell — an unquoted paste makes zsh read `<` as a
redirect, which is how the file ends up empty and every request goes to `undefined`:

```
cat > .env.local <<'ENV'
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
ENV
```

Then `cat .env.local` and confirm two non-empty lines before starting the dev server.

New projects issue a **publishable** key (`sb_publishable_…`) where the docs still say
"anon public". It goes in the same variable. It is public by design — it identifies the
project, and RLS, not the key, is what keeps one angler's catches away from another's.

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

Seed data collides if a pack is applied twice; the migrations are written to be
idempotent, so a `duplicate key` from `db push` means a migration is missing an
`on conflict do nothing` rather than that your database is dirty.

## 3. Field-test the outbox

1. `npm run dev` with **no** `DEV_AUTH_BYPASS`.
2. Airplane mode. Tap the mark a few times. Badge reads "N waiting to back up".
3. Come back online and sign in at `/sign-in`. The badge should reach "Backed up"
   without you touching anything else — signing in is itself a flush trigger
   (`run-flush.ts`), which is the sequence a real trip actually produces.
4. Table editor: `catch` (and `trip`) rows with `angler_id = auth.users.id`.

If the badge stays waiting, open the network tab: 401 = session, 409 duplicate is
success, 400 with `PGRST204` is a column the allowlist missed.

## What has already been checked, and what has not

Every migration has been applied in order to an empty Postgres 16 with Supabase-shaped
roles, and against that database: the signup trigger creates the `angler` row; a full
catch (species, length, weight, `tags`, `favorite`, `quantity`, `regulation_snapshot`)
inserts as `authenticated` with RLS on; a second angler and `anon` both see zero rows;
and stamping someone else's `angler_id` is refused by the policy. `postgrest-payload.ts`
carries no column the schema lacks, in any of the nine synced tables.

What that does **not** cover is the network: PostgREST's own behaviour, the magic-link
round trip, and the JWT. Step 3 above is still the only thing that proves those.
