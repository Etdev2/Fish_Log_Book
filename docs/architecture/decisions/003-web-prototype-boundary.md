# 003 — Where the web prototype ends and the shared product begins

**Date:** 2026-08-28 · **Status:** accepted
**Implements:** D21, D21a, D22, D23, D24 · **Constrained by:** D15, D3, P6
**Related:** `001-canonical-ontology-shape.md`, `004-offline-store-and-sync.md`

## Context

D21 puts a mobile **web** build in this Next.js repo, now, as a prototype the founder can
carry on a boat and as the spec for the Swift client. D15 is untouched: native iPhone +
Watch is still the shipping V1.

That is two clients against one product, and the failure mode is well known and quiet. It
does not arrive as a decision. It arrives as one small rule written in a React component
because that was where the bug was, then written differently in Swift six weeks later
because nobody knew the first one existed. By the time the numbers disagree, both are load
bearing and neither is wrong.

The founder already named the price — "the logging and calendar UI gets written twice" —
and the sentence after it is the one this ADR enforces: *only* the view layer.

## The call

### 1. One repo. The Xcode project lives at `ios/`

This closes `coo -> architect` ask #1. The Swift client goes in this repository, not a
sibling one.

The shared spec — schema, sync protocol, vocabulary, test vectors — has to be one `git
pull` from both clients or it is not shared, it is copied. A second repo makes drift the
default and synchronisation a chore somebody has to remember. Xcode noise in the tree is
the smaller problem, and `.gitignore` plus path-filtered CI handles it.

### 2. Folder structure

```
src/
  app/                      Next.js routes. Thin. Wiring, not logic.
    page.tsx                the month calendar (D23)
    day/[date]/page.tsx     the day page: journal + trips + Start Fishing if today
    trip/[id]/page.tsx
  features/                 one folder per capability; each owns components + queries
    calendar/  journal/  trips/  catches/  marks/  rig/  spots/
  core/                     PLATFORM-AGNOSTIC. The spec the Swift client is built from.
    ontology/               domain types, vocabulary contracts, state enums
    rules/                  day bucketing, mark lifecycle, rig inheritance, tide state,
                            current bearing (D20) — pure functions, no I/O
    rules/vectors/          JSON test vectors, loaded by BOTH TS and Swift tests
    sync/                   mutation envelope, id generation, conflict policy (ADR 004)
  lib/                      infrastructure, no domain knowledge
    supabase/  offline/  dates/  units/
  components/               shared dumb UI
supabase/
  migrations/               the schema. The one true definition. ADR 003 §4
  functions/                edge functions: enrichment, vocabulary serving
ios/                        Xcode project (D15). Not yet created.
docs/architecture/          ontology, decisions, diagrams, sync-protocol.md
```

`core/` imports nothing from `app/`, `features/`, React, or Next. Features do not import
each other's internals; shared things move down into `core/` or `lib/`. No component
touches Supabase — it goes through the feature's query layer.

### 3. The line: written once vs. allowed to be duplicated

**Written ONCE. A second implementation of any of these is a defect, not a trade-off.**

| thing | where it lives | why it cannot be duplicated |
|---|---|---|
| Schema, RLS, views, constraints | `supabase/migrations/` | The constraints *are* the rules (D22's exclusion, D24's immutability). A client-side copy is a suggestion. |
| Controlled vocabularies | database tables + versioned endpoint | Three clients with three compiled enums disagree within one release. Already settled; D21 doubles the stakes. |
| Enrichment (tide, weather, moon backfill, NCEI) | `supabase/functions/` | Owns API keys, rate limits, `algo_version`, `provenance`. A client that fetches NOAA directly leaks coordinates (§6 leak #4). |
| Sync protocol | `core/sync/` + `docs/architecture/sync-protocol.md` | The doc is normative and is what Swift is built against; the TS is one conformant implementation. ADR 004. |
| Cross-client maths | `core/rules/` + `core/rules/vectors/*.json` | Kept arithmetic on purpose so writing it twice is safe. The vectors are what makes "safe" verifiable. |
| Statistics / correlation / bite score | server, TypeScript (P6) | V2, and the reason P6 exists. |

**Allowed to be duplicated: the view layer. Nothing else.**
`src/features/*/components/**`, `src/components/**`, `src/app/**`. React in the web
client, SwiftUI in the native one. Screens, layout, animation, gesture handling, copy.

### 4. Test vectors are how the duplication is policed

`core/rules/vectors/` holds plain JSON: input, expected output, one file per rule.
`day-bucketing.json`, `tide-state.json`, `current-bearing.json`, `live-window.json`.
The TS unit tests load them. The Swift unit tests load the same files off disk. When the
two clients disagree about which day a 01:30 halibut belongs to, the vectors say who is
wrong, and adding a vector is how a bug gets fixed in both places at once.

This costs about an hour to set up and it is the cheapest insurance in the project.

### 5. The web client talks to Supabase the way Swift will

Writes do **not** go through Next.js Server Actions. The browser uses `supabase-js` with
the anon key under RLS, through the same outbox that ADR 004 defines — because Swift
cannot call a Server Action, and a protocol only one client can speak is not a protocol.

Server Actions and route handlers are for what a browser must not do: triggering
enrichment, anything holding a secret, anything needing the service role. Those become
edge functions the Swift client can call identically.

*Consequence, stated plainly:* the web build gives up some of what Next 16 is good at.
`experimental.useOffline` retries a pending Server Action across a connectivity drop
(`node_modules/next/dist/docs/01-app/02-guides/offline-support.md`) and we will not be
using it for writes. We use it for navigation and read fallbacks only. ADR 004 §7.

### 6. The tripwires

Conventions decay. These do not:

- ESLint `no-restricted-imports`: `src/core/**` may not import `react`, `next`, or
  anything under `src/app`, `src/features`, `src/lib`.
- ESLint: `src/app/**` and `**/components/**` may not import `@supabase/*`.
- CI fails if a file under `core/rules/` has no vector file.
- PR checklist, one line: *if you wrote a rule inside a component, it belongs in `core/`.*

`head-dev` owns turning these on. Until they are on, this ADR is a wish.

## What it costs us

- **The calendar and logging UI get written twice.** Accepted by D21, priced by the
  founder. This ADR does not reduce that cost; it fences it.
- **Not using Server Actions for writes** gives up Next 16's nicest mutation ergonomics
  and the built-in retry. We trade it for one protocol both clients speak.
- **A monorepo with an Xcode project in it** means noisier diffs, `.gitignore` care, and
  CI that has to know which paths matter. Cheaper than drift.
- **Vectors are a discipline.** Nobody enjoys writing them and they only pay off the day
  two clients disagree — which is a day that will definitely arrive.
- **`core/` will feel like ceremony** for the first two weeks, when there is one client
  and the rule looks like bureaucracy. It stops looking like that in week three.

## Rejected

- **A separate `fishlog-ios` repository.** The clean-looking option, and the one that
  guarantees the schema and the sync protocol drift. Rejected on the strength of the
  single argument in this ADR.
- **A shared TypeScript package the Swift client cannot use.** Publishing `core/` as an
  npm package helps a future Expo or web-admin client and does nothing for Swift, which
  is the client that actually ships. Deferred until a second JS consumer exists.
- **Writing the web prototype as throwaway code outside `src/`.** Tempting, and the
  reason to say no is that D21 explicitly makes it the *spec* for Swift. Throwaway code
  does not get read carefully enough to be a spec, and it never actually gets thrown away.
- **Server Actions for writes, with a separate REST path for Swift.** Two write paths
  means two sets of validation, and the second one is always the stale one.
- **Waiting for the Swift client before writing the migration.** The schema is the shared
  artefact. It should exist before either client, and it now does.
