### 2026-08-28 | coo -> architect, head-dev, git-integrator

## AWAITING_ARCHITECT — shell/proxy/token integration gate

The configured Codex `architect` adapter is HIGH and maps to `gpt-5.6`; that model is
not supported by this ChatGPT-account runtime. No Codex architect was launched and no
architecture decision has been made here. A supported architect runtime (or human
architect) must answer the bounded calls below before the shell branch integrates.

### Already closed

- UX Learning Dashboard is locally complete at `47a7396` and `54d6962`.
- Shell/token work is locally complete at `612ff27` and `5424b3a`.
- Review findings 1, 3, and 4 are closed. Finding 2 is the proxy/offline/auth decision
  below; it is architect-blocked, not an implementation defect.
- The Learn-navigation amendment is `79928be`, atop the design branch.

### Decisions required

1. **Auth boundary and offline guarantee.** ADR 005 §5 asks for a product-layout redirect
   while also requiring product routes to remain static; `src/proxy.ts` instead refreshes
   the session and gates before rendering. Decide whether proxy is the accepted auth gate,
   and whether `/learn` is intentionally public (`src/proxy.ts:49-53`) under the amended
   normal-navigation rule. This determines whether the shell preserves ADR 004's
   no-network-first-paint guarantee.
2. **Missing Supabase environment behavior.** `src/proxy.ts:16-18` currently bypasses the
   auth check if public Supabase env values are absent. Decide explicitly: developer-shell
   fail-open with visible diagnostics, or fail-closed/diagnostic error. RLS gives anon no
   data access, but ADR 004 requires token refresh/retry behavior once configured.
3. **Canonical token contract.** `src/core/design/tokens.json` is the ADR 005 §2 source,
   but its `$note` text still says proposed/move/open question after `88741ff` moved and
   implemented it. The generator uses the `light` value and emits dark overrides only when
   values differ; all present pairs are identical. Confirm that this is the accepted V1
   dark-only schema and that stale notes may be normalized by head-dev, or request a
   revised token contract. Confirm whether Archivo/IBM Plex Mono is settled rather than
   still metadata-marked open.
4. **Schema/type gate.** No generated Supabase `Database` type exists; schema branches are
   separate. Decide whether the proxy/auth integration gate requires generated types now or
   defers them to schema integration. Do not make shell integration wait accidentally on
   an unselected type-generation workflow.

### Merge order after the decisions

1. `git-integrator`: start from local `main` `8153451`; integrate the design chain through
   `79928be` first, retaining ADR 005 and its Learn amendment.
2. Integrate `ux-ui/learning-dashboard-prototype` through `54d6962` (the shell commits
   already share its earlier `9bd1323` base).
3. After architect answers items 1-4, `head-dev` makes only the resulting shell correction
   on `head-dev/shell-and-tokens`; rerun its focused checks/review.
4. `git-integrator` integrates `head-dev/shell-and-tokens` through `5424b3a` plus that
   correction. Resolve only mechanical conflicts; return proxy/token semantics to owners.
5. Run the combined build/lint/focused shell + dashboard checks, then perform the approved
   merge. Do **not** merge the older parallel `head-dev/design-tokens` `88741ff`; its
   pipeline overlaps the shell branch and is evidence/input for the token decision only.

### Downstream assignments

- `head-dev`: wait for the four answers; then implement only the selected proxy/token/type
  follow-up on the shell branch and give test-agent an exact command report.
- `git-integrator`: preserve all local commits; do not merge shell before the answers; use
  the order above after test/review evidence is current.
- `ux-ui`: no further work in this gate unless decision 3 changes token values; UX owns
  values, not pipeline mechanics.

