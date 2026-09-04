#!/usr/bin/env node
/**
 * The tripwires that ESLint cannot express (ADR 003 §6, ADR 005 §1–§2).
 *
 * Conventions decay. These do not.
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const failures = [];

const tracked = (pattern) =>
  execSync(`git ls-files ${pattern}`, { encoding: "utf8" }).split("\n").filter(Boolean);

/* ---- 1. No CSS Modules. Tailwind v4 is the one way to style a thing (ADR 005 §1). ---- */

/**
 * The last two of their kind. They belong to another workstream's tree and are converted
 * in head-dev/tailwind-convergence. When that PR lands this list goes to zero and never
 * grows again — a permitted exception is how this rule dies.
 */
const LEGACY_CSS_MODULES = [
  "src/features/learning/learning-dashboard.module.css",
];

const cssModules = tracked("'*.module.css'");
const newCssModules = cssModules.filter((f) => !LEGACY_CSS_MODULES.includes(f));
if (newCssModules.length > 0) {
  failures.push(
    `CSS Modules are not the convention (ADR 005 §1). Use Tailwind utilities:\n` +
      newCssModules.map((f) => `    ${f}`).join("\n"),
  );
}
const staleLegacy = LEGACY_CSS_MODULES.filter((f) => !cssModules.includes(f));
if (staleLegacy.length > 0) {
  failures.push(
    `These are gone — remove them from LEGACY_CSS_MODULES in scripts/check-tripwires.mjs:\n` +
      staleLegacy.map((f) => `    ${f}`).join("\n"),
  );
}

/* ---- 2. No raw colour or size literals in components (ADR 005 §2). ---- */

const LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\[\d+(?:\.\d+)?(?:px|rem|em)\]/;

/**
 * The one exception to the 16px type floor (docs/design/01-foundations.md §2), and it is
 * deliberately the narrowest one expressible: a font-size literal on a line that renders
 * an SVG <text>/<tspan>, i.e. a tick label plotted inside a chart.
 *
 * Why this is allowed where the design doc says "no escape hatch": the floor exists so a
 * reader is never forced to read something they cannot. A tick label is never the only
 * carrier of its value — every chart that plots one also ships the same numbers as real
 * text at the full scale (the tide chart's "Show the numbers instead" table), which is
 * the condition §1.2 sets for relaxed treatment. Chart geometry, unlike prose, cannot
 * absorb 16px labels without dropping data points.
 *
 * This exempts SIZE only. A raw colour on an SVG text line still fails, and a font-size
 * literal one character outside an <text> element still fails. If you are reaching for
 * this because a layout feels cramped, you want the layout changed, not this rule.
 */
const LITERAL_GLOBAL = new RegExp(LITERAL.source, "g");

const isChartTickLabel = (line, match) =>
  /<(text|tspan)\b/.test(line) && /^\[\d+(?:\.\d+)?(?:px|rem|em)\]$/.test(match);

for (const file of tracked("'src/**/*.tsx'")) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const offending = [...line.matchAll(LITERAL_GLOBAL)]
      .map((m) => m[0])
      .filter((literal) => !isChartTickLabel(line, literal));
    if (offending.length > 0) {
      failures.push(
        `Raw colour/size literal in a component (ADR 005 §2) — add a token to ` +
          `src/core/design/tokens.json instead:\n    ${file}:${i + 1}  ${line.trim()}`,
      );
    }
  });
}

/* ---- 3. Every rule in core/rules/ has a test vector (ADR 003 §4). ---- */

const RULES_DIR = "src/core/rules";
const VECTORS_DIR = join(RULES_DIR, "vectors");
if (existsSync(RULES_DIR)) {
  const vectors = existsSync(VECTORS_DIR) ? readdirSync(VECTORS_DIR) : [];
  for (const file of readdirSync(RULES_DIR)) {
    if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
    const expected = `${file.replace(/\.ts$/, "")}.json`;
    if (!vectors.includes(expected)) {
      failures.push(
        `${join(RULES_DIR, file)} has no test vector (ADR 003 §4). ` +
          `The vectors are what let the Swift client be checked against this one. ` +
          `Add ${join(VECTORS_DIR, expected)}.`,
      );
    }
  }
}

/* ---- 4. A preference is read through a `useX` hook, never `pref.use()`. ---- */

/**
 * React Compiler is on, and it identifies hooks by NAME. `something.use()` is a member
 * call, so the compiler does not see a hook, memoizes the component as if it had no
 * reactive dependency, and the component never re-renders when the store catches up with
 * localStorage. Nothing fails: no error, no warning, no failing test — the setting simply
 * never appears to have been saved.
 *
 * Caught in the legal-notices work, where the acknowledgement asked again on every visit.
 * `createLocalPreference` returns `.use()` and `.useIsSet()` for a named wrapper to call,
 * and that wrapper is the only place either may be called from. Any `.useSomething()`
 * member call counts: the compiler does not care what the method is named, only that a
 * member expression is not a name it recognises as a hook.
 */
const PREF_WRAPPERS =
  /export function use[A-Z]\w*\s*\([^)]*\)\s*(?::[^{]+)?\{\s*return \w+\.use[A-Za-z]*\(/;
for (const file of tracked("'src/*'")) {
  if (!/\.tsx?$/.test(file) || file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
  const text = readFileSync(file, "utf8");
  if (!/\b\w+\.use[A-Za-z]*\(\)/.test(text)) continue;
  if (PREF_WRAPPERS.test(text)) continue;
  failures.push(
    `${file} calls \`.use()\` directly. React Compiler recognises hooks by name, so a ` +
      `member call is not seen as one and the component is memoized into never updating. ` +
      `Wrap it: \`export function useThing() { return thingPreference.use(); }\`.`,
  );
}

if (failures.length > 0) {
  console.error(`\ntripwires: ${failures.length} problem(s)\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  process.exit(1);
}
console.log("tripwires: clean.");
