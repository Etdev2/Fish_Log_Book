# Joint code review — architect + ux-ui — 2026-09-01 (afternoon)

**Scope.** Everything that landed on `main` today: tide work (#10), tackle box (#11),
category pages (#12), fish-log MVP (#13), the morning staff-meeting minutes +
quick-mark opt-in + setup screens (#15), fish-log setup (#16), on top of the shell.
Plus a review of the meeting document itself
(`docs/team/meetings/2026-09-01-september-staff-meeting.md`).

**Method.** Fresh `npm ci` off `main` (`a64bac6`), full `npm run verify`, then module-by-module
reads of the new code (`catches`, `setup`, `lib/offline`, `core/sync`, `shell`), then a
14-route headless-browser smoke (status codes + console/page errors at 390px), DOM and
ARIA probes, and a visual sweep of the new screens. No fabrication: every claim below was
observed in code or in the live DOM — and the "cleared" list is written down too.

`npm run verify` on `main` before any edits: **tokens ✓ · tripwires ✓ · lint ✓ · tsc 0 errors ✓ · 303/303 tests ✓**.
Main was **not** broken at rest. The errors were of a different kind: things the code
*says* that aren't true, and heading structure.

---

## A. Errors found — fixed in this PR (4)

### E1 — Every screen claims "Backed up" with a green dot. Nothing has ever been backed up. — SEVERE
`readBackupState()` returned `{ kind: "settled" }` unconditionally
(`src/features/shell/queries/backup-state.ts`), and the badge maps `settled` →
green dot + **"Backed up"** on every screen (`shell-frame.tsx` header). Zero rows have
ever left this device — the sync store and flusher don't exist yet. ADR 004 §6 reserves
"Backed up" for *on the server*; this was the most fish-shaped sentence in the product
and the meeting's own #1 defect.

**Fix:** new state `{ kind: "local-only" }` — the only honest state while the outbox
store is unbuilt — rendered as **"Saved on this device"** with the quiet grey dot.
Green is now earned only by `settled`. Existing vocabulary contract tests kept; new test
pins `local-only` → the new words.
Files: `backup-state.ts`, `backup-badge.tsx`, `backup-state.test.ts`.

### E2 — `/tides` has no `h1` at all (WCAG 1.3.1)
The immersive tide canvas is built from buttons and readouts; the only headings on the
whole route were the `h2`s inside the four dormant sheets (station / moon / date /
cached-days). A screen-reader landmark outline of the app's flagship screen was empty.

**Fix:** `<h1 className="sr-only">Tide</h1>` at the root of both render branches.
Zero visual change (verified by screenshot).
File: `src/features/conditions/tide-screen.tsx`.

### E3 — Tackle category pages skip a heading level (h1 → h3)
`/tackle/hooks` etc. render the category `h1`, then card titles and empty-state titles
at `h3` with no `h2` between. The same component is correct on the main box page, where
the visible **"All gear" h2** genuinely heads the section — which is how it slipped through.

**Fix:** when scoped to a category, the inventory section now emits an unseen
`<h2 className="sr-only">All {category}</h2>` so the outline walks h1 → h2 → h3 on both
pages. Zero visual change (verified in DOM: `H1:Hooks | H2:sr:All hooks`).
File: `src/features/tackle/components/tackle-inventory-list.tsx`.

### E4 — `docs/team/HANDOFF.md` first paragraph was false
"**No application code written yet.** The Next.js app in src/ is an unmodified starter
skeleton." — written 2026-08-28, now wrong by ~2,500+ lines of application code and is
the document every new agent is told to read first (the meeting flagged this too).

**Fix:** header paragraph rewritten to today's truth, including the two owner rulings
still pending and the **2026-09-04 fixture expiry** date.

---

## B. Suspected errors, investigated, cleared — written down so nobody re-burns the hour

1. **"Marksaved" (missing space in the quick-mark toast)** — looks jammed in a
   screenshot, but the DOM string is `"Mark saved"` with the space. Rendering artifact,
   not a typo. Cleared.
2. **"Quick Log sheet has no dialog semantics"** — probe error. The sheet *is* a native
   `<dialog>` (`showModal()`), `aria-labelledby="quick-log-title"`, closes on Escape,
   labelled by a real `h2`. Rest-element queries missed its implicit role. Cleared.
3. **"`tsc` errors: `idb` not found"** — stale `node_modules` from before a branch
   switch. `npm ci` after checkout; 0 errors. Cleared.
4. **"Meeting said 281 tests, repo has 303"** — the minutes were written at 6 a.m.;
   three PRs landed after. Both numbers true at time of writing. Not a doc error.
   (Same for 6 → 7 migrations.)
5. **"/log has h1 but no h2"** — valid heading structure: one h1, paragraphs, no
   sections. Cleared.

## C. Real issues NOT fixed in this PR — roadmapped or awaiting rulings

- **Tide fixture window expires 2026-09-04 (3 days).** After that the tide screen shows
  its (honest) "No tide predictions loaded" empty state until live data lands. This is
  owner decision #1 from the meeting; implementing live NOAA fetch without the ruling
  would put words in the owner's mouth. **Urgent.**
- **`docs/legal/` does not exist** (counsel's item: privacy policy & terms before any
  public demo). Out of engineer scope.
- **Sync flusher + `src/core/sync/store.ts` remain unbuilt** — head-dev lane, in
  flight per meeting action items. E1 keeps the glass honest until it lands.
- Two unrelated types are both named `BackupState` (`core/sync/outbox.ts` with
  `backed_up` vs `features/shell/queries/backup-state.ts` with `settled`). Not wrong —
  different layers — but worth renaming one before the flusher wires them together.
- Learn-page "Diagnostics" and the notification-broom TODOs are real TODOs, honestly
  marked, low priority.

## D. Review of the morning staff meeting (the document itself)

- **Accurate where verifiable.** The two headline claims we could test — the "Backed
  up" lie and the stale HANDOFF — were both real and both reproduced exactly. The
  minutes' own correction commit (`f191d46`, CI/Vercel claim) exists in history.
- **Honest about uncertainty.** Roles flagged their own unverified claims rather than
  bluffing; nothing in the doc asserts what it can't show.
- **Action items listed today were indeed "not started"** when stated; this review took
  the two doc/honesty items (E1, E4) as part of the fix scope, and the a11y sweep (E2,
  E3) confirms the meeting's Medium a11y item was well-founded.
- **One gap worth noting for future minutes:** the meeting's architecture section
  proposes a "backup indicator shows three states" audit — with E1 fixed, the *real*
  three-state audit now blocks on the flusher, not on the badge.

## E. What reviewed clean (worth emulating)

- `uuidv7`: monotonic sequence with same-ms and *backwards-clock* borrow-forward
  handling; test-seam reset. Load-bearing and correct.
- `outbox.ts`: the outcome→state machine is **total** over its union (no undefined
  branch); full-jitter backoff with injected randomness; vocabulary in the type system.
- Quick mark: Undo acts on the in-flight write's **promise** so the button never blocks;
  `aria-live` announcement is deliberately separate from the timed-out visual toast;
  storage-blocked state is surfaced instead of silently failing.
- `preference.ts`: the hydration-hazard handling (server snapshot + subscribe-gated
  ref) is documented next to the code, and Safari-private-mode `localStorage` throws are
  caught. Careful code.
- Zero console errors / page errors across all 14 smoked routes; all stubs are honest
  stubs ("The month grid lands next", "Prototype: changes stay in this session…").

## F. Verification of this PR

- `npm run verify`: tokens ✓ · tripwires ✓ · lint ✓ · tsc 0 errors ✓ · **304/304 tests ✓**
  (303 + the new local-only vocabulary test).
- Live DOM after fix: badge = `Saved on this device` + grey dot; `/tides` h1 = `Tide`
  (sr-only); `/tackle/hooks` outline = `H1:Hooks → H2(sr):All hooks`.
- Screenshots (390px): badge, tide screen (visually unchanged), hooks page,
  `/log` at 320px, `/setup`.
