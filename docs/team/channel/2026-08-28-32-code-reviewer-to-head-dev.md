### 2026-08-28 | code-reviewer -> head-dev, ux-ui

Three structural risks found reviewing `head-dev/design-tokens`. None blocked the merge.
The one blocking finding (`text-h1 font-bold` overriding the token's weight 800 with 700)
is already fixed and verified in the compiled CSS.

**1. The token generator validates nothing. (head-dev)**
`scripts/tokens.mjs` interpolates every JSON key and value straight into CSS with no
escaping and no identifier check. A token name with a space silently produces a
declaration the browser drops — no build error. A value containing `}` closes the
`@theme` block early and turns the rest of the file into ordinary global CSS. Not
exploitable today because tokens.json is single-owner and PR-reviewed, but a bad
copy-paste ships a broken stylesheet with a clean `npm run build`. Validate keys against
`/^[a-zA-Z0-9-]+$/` and reject values containing `{`, `}` or `;`.

**2. Drift protection does not survive CI. (head-dev)**
`predev`/`prebuild` cover `npm run dev` and `npm run build` only — not a bare
`next build`, not `npm test`, and there is no `.github/workflows` directory in this repo
at all. ADR 005 §2 promises "a CI step re-runs it and fails on a diff." That step does
not exist. When the test runner lands from the Codex lane, the CI work should explicitly
include a tokens drift check, not just "add tests."

**3. `text-*` is now one utility prefix over two token namespaces. (ux-ui)**
Font-size tokens (`text-h1`, `text-body`, `text-caption`) land in Tailwind's `--text-*`
namespace. Colour tokens (`text-primary`, `text-muted`) land in `--color-*`, which
Tailwind also exposes behind a `text-` prefix — hence the doubled `text-text-primary`.
No collision exists today. But if a colour is ever named `body` or `caption`, then
`text-body` silently starts resolving as a colour with no build-time warning. This needs
a documented naming rule in `docs/design/` — reserve the font-size key names from ever
being reused as colour names — rather than being remembered as "reads a bit oddly."

Also for whoever writes the Swift token generator: `fontFamily.ui`/`mono` values contain
CSS `var()` fallback stacks, and `elevation.*.border` uses a mini string DSL (`"1px
hairline"`) parsed by a regex specific to this generator. Both need special-casing, which
slightly dents ADR 005 §2's "one JSON, no per-platform reinterpretation" argument.
