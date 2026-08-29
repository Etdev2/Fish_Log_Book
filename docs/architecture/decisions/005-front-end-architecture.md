# 005 — Front-end architecture: styling, tokens, directories, shell, and state

**Date:** 2026-08-28 · **Status:** accepted
**Implements:** D21, D22, D23, D26 · **Constrained by:** D25, D27
**Depends on:** `003-web-prototype-boundary.md` (folder law, no Server Actions for writes),
`004-offline-store-and-sync.md` (local store is the read path)
**Scope this round:** design system + app shell. No product screens.

## Context

Four product surfaces — logging, conditions, calendar/history, insights — are at zero
lines of code. Two routes exist: `/` (a Supabase connection check) and `/learn` (an
internal prototype). That is the good news: almost nothing has to be undone.

The bad news is that the little that exists already teaches two contradictory lessons.
Tailwind v4 is installed and wired through `@tailwindcss/postcss`, `globals.css` imports
it, and inline utility classes are in active use — *and* two `*.module.css` files sit
next to them. A repo that does both does not have two options. It has a coin flip that
every future agent has to make, differently, forever, and a design system that exists in
two incompatible dialects.

ADR 003 already fixed the folder law and the write path. ADR 004 already fixed the read
path: **every screen renders from the local store; reads never touch the network.** Most
of what follows is downstream of that one sentence, and where an answer looks surprising
it is usually because ADR 004 already removed the problem the conventional answer solves.

Next 16 specifics below were checked against `node_modules/next/dist/docs/01-app/`
(`01-getting-started/11-css.md`, `05-server-and-client-components.md`,
`03-layouts-and-pages.md`, `02-guides/single-page-applications.md`,
`02-guides/client-side-data-fetching/index.md`, `02-guides/offline-support.md`,
`03-api-reference/03-file-conventions/{route-groups,dynamic-routes,proxy}.md`).

---

## 1. Styling: Tailwind v4 is the production convention. CSS Modules are removed.

**The call.** Every component is styled with Tailwind v4 utility classes in `className`.
No new `*.module.css` file is created, ever. Anything a utility genuinely cannot express
— keyframes, `::-webkit-scrollbar`, a complex descendant selector, a print sheet — is
declared as a named class in a global stylesheet under `src/styles/` using Tailwind v4's
`@utility` or `@layer components`, and is then used from `className` like any other
utility. There is exactly one way to style a thing, and it always looks the same at the
call site.

**Why.**
- It is already the majority convention, already installed, and requires no new
  dependency. The losing option is the one with two files in the repo.
- Next's own guidance in `01-getting-started/11-css.md` is "use Tailwind CSS for most
  styling needs; use CSS Modules for component-specific styles when Tailwind utilities
  aren't sufficient." That is exactly this rule, in that order.
- **Tokens reach components for free.** Tailwind v4's `@theme` generates utilities
  directly from CSS custom properties, so decision 2's generated token file *is* the
  utility vocabulary. With CSS Modules there is a second hop — `var(--color-surface)`
  typed by hand into every file, unchecked, misspellable.
- **Deleting a component deletes its styles.** In a prototype whose screens will be
  redrawn several times, orphaned CSS is the predictable cost, and CSS Modules are the
  only one of the two options that can accumulate it.
- **Ordering.** Next chunks CSS by import order and warns that dev and production order
  can differ. One global entry point plus utilities removes that class of bug outright.
- The primary authors here are agents. A utility class is legible in the same file as
  the markup; a semantic class name requires opening a second file to know what it means,
  and agents skip that step and guess.

**Rejected: CSS Modules as the convention.** Semantic class names read nicely and diff
cleanly, and long `className` strings are genuinely uglier. Rejected because the
tie-breaker is not aesthetics — it is that one of these two options costs nothing to
adopt and the other costs a migration, a token indirection layer, and a dead-CSS habit.
Also rejected because "Tailwind for layout, CSS Modules for components" is the compromise
that sounds reasonable in a meeting and produces the coin flip described above.

**Rejected: a CSS-in-JS library.** Runtime cost, RSC friction, and a third dialect.

**Consequence a future agent must live with.**
- `src/components/app-nav.module.css` and `src/features/learning/learning-dashboard.module.css`
  are the last two of their kind. They currently sit in another workstream's uncommitted
  tree and are **not** to be touched by this round. Once that branch merges, `head-dev`
  converts both in one bounded PR (`head-dev/tailwind-convergence`), which also relocates
  `app-nav` per decision 4.
- After that PR, a CI tripwire fails the build if `git ls-files '*.module.css'` returns
  anything. No path exceptions — a permitted exception is how this rule dies.
- Some markup will have long class strings. That is the accepted price, not a bug to be
  fixed by inventing a wrapper abstraction.

---

## 2. Design tokens: one JSON file, generated into CSS, later generated into Swift.

**The call.** The source of truth is **`src/core/design/tokens.json`** — plain JSON, no
TypeScript, no CSS, no framework.

```
src/core/design/tokens.json        the truth. Hand-edited by ux-ui.
scripts/tokens.mjs                 generator. JSON -> CSS.
src/app/tokens.generated.css       committed output. Never hand-edited.
scripts/tokens-swift.mjs           written the day ios/ exists. Same JSON -> Swift.
```

The path is chosen for consistency with ADR 003, which already puts language-neutral
shared artefacts (`core/rules/vectors/*.json`) under `src/core/` and has the Swift client
read them off disk. Design tokens are the same kind of object: a decision that is shared,
in a format neither client owns.

**How a token reaches a component, concretely.**

1. ux-ui edits `tokens.json`. Each semantic token carries its light and dark value.
2. `npm run tokens` emits `src/app/tokens.generated.css`: a `@theme { ... }` block for the
   defaults plus one override block for dark. It is wired into `build` and `dev` so it
   cannot silently go stale, and a CI step re-runs it and fails on a diff.
3. `src/app/globals.css` does `@import "tailwindcss";` then
   `@import "./tokens.generated.css";`.
4. Tailwind v4 turns `--color-surface` into `bg-surface`, `--spacing-gutter` into
   `p-gutter`, and so on.
5. The component writes `className="bg-surface p-gutter"`. It imports nothing.

`npm run build` is the check that matters here; per Next's CSS guide, dev and production
CSS ordering can differ, so verify the generated `@theme` in a production build, not just
in `next dev`.

**Why.** D21 duplicates the *view layer* and nothing else. A colour ramp is not a view —
it is a decision, and a decision written twice is a decision that will disagree with
itself. JSON is the only format both a PostCSS pipeline and a Swift build phase can read
without either one pretending to be the other. The generator is roughly fifty lines and
buys the same guarantee ADR 003 bought with test vectors.

**Rejected: `@theme` in `globals.css` as the source of truth.** One fewer file and one
fewer build step, and it makes the Swift client parse CSS or, more realistically, retype
every value by hand. That is the drift ADR 003 exists to prevent, arriving through the
back door.

**Rejected: a `tokens.ts` exporting a typed object.** Better DX for the web, useless to
Swift, and it invites components to `import { colors }` and interpolate values into
inline styles — which reintroduces the second dialect decision 1 just removed.

**Rejected: Style Dictionary or another token toolchain.** Correct at ten platforms,
absurd at two. Fifty lines of Node beats a dependency with a config format.

**Consequence a future agent must live with.**
- **No raw hex, rgb, px font-size, or arbitrary Tailwind bracket value in a `.tsx` file.**
  CI greps for it and fails. If a value is missing, add a token; do not inline one.
- `tokens.generated.css` is build output that happens to be committed. A PR that
  hand-edits it is wrong even if it works.
- ux-ui owns the *values* in `tokens.json` and the naming of the semantic layer. This ADR
  owns only the file, the format, and the pipeline. Visual language lives in `docs/design/`.

---

## 3. Directory contract

ADR 003 §2 set the tree. This is the rule that makes it decidable without asking.

> **Does the file render UI?**
> - **No** — is it pure domain logic or a type, with no I/O? → `src/core/`. Does it talk
>   to a network, a browser API, a database, or the clock? → `src/lib/`.
> - **Yes** — does Next require this exact filename (`page`, `layout`, `loading`, `error`,
>   `not-found`, `template`, `default`, `route`, `proxy`, a metadata convention)? →
>   `src/app/`. Nothing else may live there.
> - **Yes, and it is not a Next convention file** — does it know a domain noun? Does the
>   word *catch*, *trip*, *mark*, *spot*, *tide*, *rig*, *journal*, or *angler* appear in
>   its name, its props, or its copy? → `src/features/<domain>/components/`.
> - **Yes, and it knows no domain noun at all** → `src/components/`.

The `src/components/` test, stated so it cannot be argued with: *could this file be
dropped into an unrelated app, unchanged, without renaming anything?* A `Sheet`, a
`Field`, a `Toggle`, an `Icon` pass. A `CatchCard` does not, no matter how generic its
implementation looks today.

**Feature folders** (per ADR 003, plus this round's additions):
`calendar/ journal/ trips/ catches/ marks/ rig/ spots/ conditions/ settings/ shell/`.
`insights/` is not created — it is V2 and P6 owns it. Each feature folder contains
`components/`, `queries/`, and its own `types.ts`. Cross-feature imports of internals are
forbidden by ESLint; if two features need the same thing it moves **down** into
`src/components/`, `src/core/`, or `src/lib/`, never sideways.

**Promotion rule.** A component moves from a feature into `src/components/` when a
*second* feature needs it, and not one minute before. Speculative shared components are
how a design system acquires props nobody uses.

**Route file budget.** A `page.tsx` unwraps `params`, does the auth gate if the layout
has not, and renders one feature entry component. If it exceeds roughly thirty lines,
something belongs in a feature.

**Why.** The previous rule ("features own their capability") is true but not decidable —
two agents can read it and disagree in good faith about a `DateStrip`. "Does a domain
noun appear in it" is mechanical, and being mechanical is the entire point.

**Rejected: an `atoms/molecules/organisms` split in `src/components/`.** It asks a
question with no correct answer ("is a `Field` a molecule?") and it will be relitigated
in every PR. Flat, alphabetical, with a hard domain-noun boundary is decidable.

**Rejected: colocating shared components inside `src/app/`.** Next permits it. It also
puts view code on the one path this project has committed to keeping thin, and it makes
the eventual "what does Swift need to reimplement" question unanswerable by `ls`.

**Consequence.** `src/components/` will look sparse for weeks and that is correct.
Anything genuinely shared arrives there by promotion, with two real callers proving it.

---

## 4. The app shell and the route map

**The call.** One root layout, three route groups, and navigation that lives in a feature.

```
src/app/
  layout.tsx                  root: <html>, <body>, fonts, globals.css. Nothing else.
  (app)/
    layout.tsx                THE SHELL: auth gate, nav, sync badge, quick-mark button
    page.tsx                  /                  month calendar — the home surface (D23)
    day/[date]/page.tsx       /day/2026-08-28    journal + trips + marks for a local date
    trip/[id]/page.tsx        /trip/:id          marks, catches, rig, conditions
    catch/[id]/page.tsx       /catch/:id         one catch; resolving a mark (D22)
    spots/page.tsx            /spots
    spots/[id]/page.tsx       /spots/:id
    settings/page.tsx         /settings          account, units, platform selector (D26),
                                                 backup state (ADR 004 §6), diagnostics
  (auth)/
    layout.tsx                no product nav
    sign-in/page.tsx  callback/route.ts
  (internal)/
    layout.tsx                no product nav, not linked from anywhere
    learn/page.tsx            the team prototype, moved here as-is
src/proxy.ts                  Supabase session refresh (Next 16: `middleware` is renamed)
```

**`/` becomes the month calendar.** D23 is unambiguous: the calendar is the app's home
surface, not a dashboard, not a feed, not a landing page. The current Supabase connection
check stops being a route; its one useful behaviour — proving env vars are set and a real
round trip works — reappears as a diagnostics block at the bottom of `/settings`, where
it sits next to the backup state an angler might actually want to look at on a boat.

**Navigation lives in `src/features/shell/`, not in `src/components/`.** It knows the
words "Calendar", "Spots", "Settings", so by decision 3's own test it is domain-aware and
cannot be a dumb component. `src/features/shell/` owns the nav, the quiet backup
indicator from ADR 004 §6, and the quick-mark button. `src/app/(app)/layout.tsx` renders
them and does nothing else. `src/components/app-nav.tsx` moves there in the convergence
PR from decision 1.

**Why route groups rather than nested paths.** The auth screens and the internal
prototype must not inherit the product chrome, and `(auth)`/`(internal)` express that
with zero URL cost. One *root* layout is kept deliberately: per the route-groups
reference, multiple root layouts force a full page reload when navigating between them,
which is precisely wrong for an app that must keep working when the network does not.

**Why the quick-mark button is in the layout.** D22's quick mark is the man-overboard
control. It has to be one thumb away from every product route, and a layout is the only
place that is true by construction rather than by remembering. Layouts do not remount
across navigation, so it and the nav keep their state for free.

**Rejected: `/calendar` as home with `/` redirecting.** An extra hop on the coldest,
most offline-sensitive load in the app, in exchange for a tidier-looking route table.

**Rejected: a dashboard home summarising recent activity.** It is the default shape of a
logging app and D23 explicitly chose against it. The calendar *is* the summary.

**Rejected: putting the shell in the root layout.** Then `(auth)` and `(internal)` would
have to opt out of chrome, and opt-out defaults leak. Chrome is opt-in, by group.

**Consequence.** Adding a product route means adding a folder under `(app)/` and nothing
else — nav and shell are inherited. A route that deliberately has no chrome must live in
a group, never by conditionally rendering the nav based on `usePathname()`.

Position and appearance of the nav (bottom bar, top bar, drawer) is ux-ui's call. This
ADR fixes only that it is one persistent element rendered by the `(app)` layout.

---

## 5. Server / client boundary: the server renders the shell, the client renders the data

**The call.**

- **Route files are Server Components** (the default). They unwrap `params`, set metadata,
  and mount one feature entry component. They fetch nothing.
- **`'use client'` goes on the feature entry component**, one per route — not on every
  leaf. Per `02-guides/server-and-client-boundary.md`, the directive is needed only at the
  entry of a client subtree; everything it imports joins the client graph automatically.
- **Data fetching lives in `src/features/<domain>/queries/`**, reading the local store
  interface from `src/core/sync/store.ts` (ADR 004 §1). Never in a component body, never
  in a route file, never on the server.
- **No Server Component ever reads domain data.** This is the hard line.
- **The server's job is:** the HTML shell, fonts, metadata, and the auth gate — session
  refresh in `src/proxy.ts` via `@supabase/ssr`, plus a redirect in `(app)/layout.tsx` for
  a missing session. `src/lib/supabase/server.ts` keeps exactly those two callers.
- **Route handlers only where a secret is involved**, and per ADR 003 §5 those should
  become Supabase edge functions the Swift client can call identically.

**Why.** ADR 004 §1 says reads never touch the network and every screen renders from the
local store. IndexedDB exists only in a browser. A Server Component therefore *cannot*
render a screen's data — and if we made one that could, we would have built two read paths
for the same pixels, which disagree the instant the boat leaves the harbour. That is not a
performance trade-off; it is the same class of defect ADR 003 was written to prevent, on
the read side.

Two supporting reasons. An RLS-authenticated server read needs cookies, which makes the
route dynamic and puts a network round trip in front of the first paint — on a phone with
one bar, that is the whole experience. And a server-rendered screen is a screen Swift
cannot reimplement from, which weakens D21's premise that this build is the spec.

The result is Next's documented SPA shape (`02-guides/single-page-applications.md`): every
product route prerenders to a static app shell, `<Link>` prefetches it, and the data
arrives from IndexedDB after hydration. That is also exactly the shape
`experimental.useOffline` wants, per ADR 004 §7.

**Rejected: Server Components fetching from Supabase for the first paint, with the local
store taking over after hydration.** Genuinely faster on a good connection, and it is what
most Next apps should do. Rejected because it means two implementations of every query,
two sets of RLS assumptions, and a first paint that can show different numbers than the
second — the failure that is hardest to reproduce and most corrosive to trust.

**Rejected: `cacheComponents: true` in V1.** There is no server-rendered user data to
cache, so it buys Suspense ceremony and nothing else. The offline guide is explicit that
without Cache Components a route-level `loading.tsx` gives the same offline behaviour at
the segment level. Revisit if server-rendered insights (P6, V2) ever land.

**Rejected: `output: 'export'` (fully static).** Tempting, since almost nothing needs a
Next server. It removes `proxy.ts`, and with it cookie-based session refresh, and it
forecloses server-rendered insights. Keep the server; use almost none of it.

**Consequence a future agent must live with.**
- Most of this app is a client bundle. That is a deliberate, priced consequence of D3 and
  ADR 004, not an accident to be optimised away by moving fetches to the server.
- No product route may become dynamic. If one does, the first paint acquires a network
  dependency and the offline story quietly breaks.
- ESLint (ADR 003 §6) already forbids `@supabase/*` imports from `src/app/**` and
  `**/components/**`. Extend the allowlist to `src/proxy.ts`, `src/lib/supabase/**`, and
  `src/app/(auth)/**` only.

---

## 6. State management: the local store is the state manager

**The call.**

| kind of state | where it lives |
|---|---|
| Server/domain data | The local store (IndexedDB via `idb`, ADR 004 §1). Read through `features/*/queries/`. |
| Reactivity over that store | A `useLiveQuery`-style hook in `src/lib/offline/`, built on React 19's `useSyncExternalStore` plus a store change event. |
| Navigable selection (which date, which trip, which spot) | The URL. `/day/[date]`, not `useState`. |
| Anything an angler would hate to lose on reload — the in-progress trip, the sticky rig (D21a), units, the platform selector (D26) | The local store, in `meta`. React context may *subscribe* to it; context never owns it. |
| Ephemeral UI — open/closed, focus, a half-typed field | `useState` / `useReducer`, in the component. |

**Why no server-data library.** SWR and TanStack Query solve caching, deduplication,
revalidation, and retry for *network reads*. ADR 004 removed all four by making every read
local and every write an outbox entry with its own retry policy. Adding one now means two
caches of the same rows with independent invalidation — the bug it was supposed to prevent,
installed on purpose. Next's own client-fetching guide frames these libraries as being for
"a shared browser cache" of server data; ours is IndexedDB.

**Why the URL for selection.** A date the angler can share, reload into, and reach with
the back button is worth more than a `useState`, and it is the only version of that state
a cold offline load can reconstruct.

**Explicitly NOT introduced in V1** — adding any of these requires a superseding ADR:

- **Redux, Zustand, Jotai, Valtio.** There is no global client state left for them to
  hold; what looked like global state is either in the URL or in `meta`.
- **TanStack Query / SWR.** Above. Revisit only if server-only reads appear (P6 insights).
- **A component library — shadcn/ui, MUI, Chakra.** Every one of these ships opinions about
  styling and structure that Swift cannot inherit, so it makes the duplicated view layer
  *more* expensive, not less. One bounded exception: if ux-ui finds that a native
  `<dialog>`/popover cannot be made screen-reader- and focus-correct, Radix **primitives**
  may be adopted for dialog, popover, and select only. Not the ecosystem around them.
- **An icon package.** Inline SVG components in `src/components/icons/`. A handful of icons
  do not justify a dependency, and inline SVG takes tokens as `currentColor`.
- **An animation library.** CSS transitions and, where it fits, the View Transitions support
  in Next 16. Revisit for V2 if a real interaction needs it.
- **A form library.** React 19 uncontrolled forms plus validators from `src/core/`.
  Validation is shared with Swift and therefore cannot live in a JS form library — and per
  ADR 003 §5 the submit path is the outbox, not a Server Action.
- **A date/time library, by default.** `src/lib/dates/` wraps `Intl` and the browser. Day
  bucketing is `core/rules` with vectors (ADR 003 §4). If a timezone library becomes
  unavoidable it goes behind `lib/dates`' own API so the Swift `Foundation` equivalent maps
  one-to-one.

**Consequence a future agent must live with.**
- The `useLiveQuery` hook is ours to write and ours to debug, roughly forty lines. If it is
  wrong, every screen is stale in the same way — which is at least easy to find.
- "Just add TanStack Query" will look like the obvious fix the first time a list does not
  refresh. It is not; the fix is the store's change notification.
- No test runner is configured in this repo at all, which means ADR 003 §4's vector rule and
  the tripwires in this ADR are currently unenforceable. `head-dev` picks a runner. This ADR
  does not, but it does note that until one exists, several rules above are wishes.

---

## What it costs us overall

- **A migration, however small.** Two `.module.css` files and one component move, blocked
  behind another workstream's branch. Cheap now; it is never cheaper later.
- **A build step for tokens.** One more thing that can be stale, mitigated by wiring it into
  `dev` and `build` and by a CI drift check.
- **A large client bundle and a thin server.** We are paying for a Next.js server and using
  it for auth and HTML. That is the honest price of offline-first, and ADR 004 already
  accepted it.
- **Hand-rolled reactivity and hand-rolled forms.** Two small pieces of infrastructure that a
  library would have given us, given up so the shared logic stays in `core/` where Swift can
  read it.
- **Long `className` strings** in files that would have been prettier with CSS Modules.

## What this unblocks

**`ux-ui` can start now:**
- Write `src/core/design/tokens.json`'s shape and values, and the semantic naming, in
  `docs/design/`. Format and pipeline are settled; values are entirely yours.
- Design against a fixed route map and a known shell: one persistent nav element, a quiet
  backup indicator, and an always-reachable quick-mark button, all in the `(app)` layout.
  Position and appearance are yours.
- Design components knowing they will be Tailwind utility classes consuming generated
  tokens — never a `.module.css`, never a hex literal.
- Specify light and dark per token; the generator handles both.

**`head-dev` can start now, without asking a structural question:**
1. `scripts/tokens.mjs` + `src/app/tokens.generated.css` + `npm run tokens`, wired into
   `dev` and `build`, with the CI drift check.
2. The route-group skeleton: `(app)`, `(auth)`, `(internal)`, `src/proxy.ts` for session
   refresh, `/learn` relocated, `/` replaced by the calendar route.
3. `src/features/shell/` with the layout, nav, backup badge, and quick-mark slot.
4. `head-dev/tailwind-convergence` — after the current uncommitted branch merges: convert
   both `.module.css` files, move `app-nav` into `features/shell/`.
5. The tripwires, which are what make this ADR real rather than aspirational: no
   `*.module.css`; no hex/rgb/arbitrary values in `.tsx`; the ADR 003 §6 import rules
   extended with the `@supabase/*` allowlist from §5 above.
6. Pick a test runner, so the vector rule and these tripwires can be enforced.

**Still blocked, deliberately:** product screens. This round is the design system and the
shell. Nothing in `features/*/components/` beyond `shell/` should exist when it ends.
