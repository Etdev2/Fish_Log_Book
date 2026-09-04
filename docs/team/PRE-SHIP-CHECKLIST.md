# Pre-ship checklist

What must be true before Fish Log Book is offered to the public. Not a roadmap — this is
only the list of things that are *blocking*, each with the evidence behind it, so that
nobody has to re-derive the reasoning at launch.

Founder direction, 2026-09-04: a legal team will be assembled to answer the legal
questions before the product ships. This file is what they should be handed.

---

## Legal

- [ ] **Contact address and governing law.** → **issue #56**
      `LEGAL_CONTACT.resolved` in `src/core/legal/documents.ts` is `false`, and every legal
      page says in amber that the documents are incomplete and the app is not ready for the
      public. `jurisdiction` carries no default on purpose: a leftover working assumption
      would otherwise become the governing law of a real contract the day somebody fills in
      the email. `documents.test.ts` fails if the flag disagrees with either field.
      Closing it is one edit — fill both, set `resolved: true`.

- [ ] **Attorney review of the three notices.** `docs` are at `/legal/regulations`,
      `/legal/terms`, `/legal/privacy`, sourced from `src/core/legal/documents.ts`.
      They are specific and honest about what the code actually does, and they were written
      by an engineer, not a lawyer. The regulations notice and the liability section are the
      two that carry real exposure: the app tells people what they may legally keep.

- [ ] **Species photo licensing.** `src/features/fish-legal/species-photos.ts` says it
      plainly in its own header: several of the 51 images are "source-restricted —
      attribution shown; Wikimedia/NOAA swap owed before release". Defensible for a dev
      build, not for public distribution.

## Correctness of things people act on

- [ ] **Confirm the NOAA tide fetch against the live service.** `queries/noaa-tides.ts` was
      written from the API documentation and has never touched the real endpoint — the
      development environment's proxy blocks `api.tidesandcurrents.noaa.gov`. One person
      with signal opening the tide chart settles it. Station ids in `stations.ts` are
      unverified for the same reason.

- [ ] **A regulation review pass on every pack shipped.** Rules are dated snapshots, and a
      wrong bag limit is the most serious defect this app can have.

## Infrastructure

- [ ] **Confirm RLS is actually applied to the production database.** The policies are
      right — `supabase/migrations/20260828120100_v1_rls.sql` enables row-level security on
      every angler-owned table with `angler_id = (select auth.uid())` on all four verbs,
      makes `trip_rig` insert-only, and revokes everything from `anon`. What is unverified
      is that the migration has been *run* against production. Migrations existing is not
      the same as migrations applied, and this is the check the privacy notice's "we do not
      share your log" claim rests on.

      **Amended 2026-09-04.** That description was true of the angler-owned tables and
      missed the reference ones. `reg_area`, `reg_group`, `reg_pack` and `reg_rule` were
      created on 1 September, three days after the blanket
      `revoke all on all tables in schema public from anon` ran — and that statement only
      affects tables that exist when it runs. They had no RLS, no policy and no revoke.
      Closed by `20260904220000_v1_regulations_rls.sql`, and
      `src/core/rules/rls-coverage.test.ts` now fails if any future table is created
      without them. **This makes the production check more urgent, not less:** if the
      earlier migrations were applied and these four tables have been live and writable,
      that wants looking at directly rather than assuming.

- [ ] **Account deletion actually deletes.** The privacy notice commits to removal from the
      active database within 30 days on request. Confirm the auth cascade covers every
      angler-owned table, and that there is a path for someone to ask.

## Keep true

Not tasks — properties the app currently has that are worth not losing, each enforced by a
test in `src/core/legal/documents.test.ts` so they cannot be lost quietly:

- No analytics, advertising, tracking, or crash-reporting dependency.
- No runtime fetch to any host beyond Supabase and NOAA tides.
- No basemap tile layer: the boundary map makes no outside calls, so looking at where you
  are does not tell anyone where you are.
- Species photos served from the app itself, never a remote host.

The first time someone proposes adding product analytics, this is the paragraph to read
first. It is a real asset — a privacy posture this clean is cheap to keep and expensive to
recover.
