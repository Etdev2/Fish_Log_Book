#!/usr/bin/env node
/**
 * The tripwires that ESLint cannot express (ADR 003 §6, ADR 005 §1–§2).
 *
 * Conventions decay. These do not.
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

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

/**
 * This used to `readdirSync("src/core/rules")` and look for `.ts` files. Once the rules
 * grew subdirectories (`astro/`, `catch/`, `tide/`) that top level held only directories,
 * so the loop matched NOTHING and the tripwire passed clean by policing nothing at all —
 * for months, silently. It now walks the tree, and a vector file declares what it covers
 * so one file can legitimately police a whole module (`astro.json` covers three) without
 * that being indistinguishable from a gap.
 *
 * A module needs a vector when it has behaviour to disagree about — an `export function`.
 * Type-only files, the constants file and the barrel have nothing for a Swift port to get
 * wrong, so they are exempt by rule rather than by being quietly missed.
 */
const RULES_DIR = "src/core/rules";
const VECTORS_DIR = join(RULES_DIR, "vectors");

/** Not modules: test files, test scaffolding, and re-export barrels. */
const isExempt = (rel) =>
  rel.endsWith(".test.ts") || rel.endsWith("test-support.ts") || rel.endsWith("index.ts");

function walkTs(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === VECTORS_DIR) continue;
      out.push(...walkTs(full, base));
    } else if (entry.name.endsWith(".ts")) {
      out.push(relative(base, full).split(sep).join("/"));
    }
  }
  return out;
}

if (existsSync(RULES_DIR)) {
  const modules = walkTs(RULES_DIR).filter(
    (rel) => !isExempt(rel) && /^export\s+function\s/m.test(readFileSync(join(RULES_DIR, rel), "utf8")),
  );

  const covered = new Map(); // module path -> vector file that claims it
  const vectorFiles = existsSync(VECTORS_DIR)
    ? readdirSync(VECTORS_DIR).filter((f) => f.endsWith(".json"))
    : [];
  for (const file of vectorFiles) {
    const parsed = JSON.parse(readFileSync(join(VECTORS_DIR, file), "utf8"));
    if (!Array.isArray(parsed.covers) || parsed.covers.length === 0) {
      failures.push(
        `${join(VECTORS_DIR, file)} has no "covers" array (ADR 003 §4). ` +
          `A vector file must name the modules it polices — e.g. "covers": ["tide/height.ts"] — ` +
          `so a module with no vector is distinguishable from one covered by a shared file.`,
      );
      continue;
    }
    for (const mod of parsed.covers) {
      if (!existsSync(join(RULES_DIR, mod))) {
        failures.push(
          `${join(VECTORS_DIR, file)} claims to cover ${mod}, which does not exist. ` +
            `Update its "covers" — a vector pointing at a deleted module polices nothing.`,
        );
        continue;
      }
      covered.set(mod, file);
    }
  }

  for (const mod of modules) {
    if (!covered.has(mod)) {
      failures.push(
        `${join(RULES_DIR, mod)} has no test vector (ADR 003 §4). ` +
          `The vectors are what let the Swift client be checked against this one. ` +
          `Add a file under ${VECTORS_DIR}/ listing "${mod}" in its "covers", with expected ` +
          `values derived from an outside authority — never from running this implementation.`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`\ntripwires: ${failures.length} problem(s)\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  process.exit(1);
}
console.log("tripwires: clean.");
