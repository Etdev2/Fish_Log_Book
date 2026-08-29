#!/usr/bin/env node
// Generates src/app/tokens.generated.css from src/core/design/tokens.json.
//
// Source of truth: src/core/design/tokens.json (ADR 005 #2). This script owns the
// mapping from that JSON to Tailwind v4's `@theme` CSS-custom-property namespaces.
// ux-ui owns the values in the JSON; head-dev owns this file and the generated output.
//
// Run with `npm run tokens`. Wired into `predev`/`prebuild` so the generated CSS can
// never go stale relative to the JSON it was built from.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const TOKENS_PATH = path.join(repoRoot, "src/core/design/tokens.json");
const OUTPUT_PATH = path.join(repoRoot, "src/app/tokens.generated.css");

function readTokens() {
  const raw = readFileSync(TOKENS_PATH, "utf8");
  return JSON.parse(raw);
}

/**
 * Reserved keys that carry design rationale rather than a token value.
 * They document intent for humans and are intentionally not emitted as CSS.
 */
const METADATA_KEYS = new Set(["$darkOnlyByDesign"]);

function cssComment(text) {
  return `/* ${text} */`;
}

/** color: { name: { light, dark } } -> two lists of `--color-<name>: value;` lines */
function buildColorLines(colors) {
  const light = [];
  const dark = [];
  for (const [name, { light: lightValue, dark: darkValue }] of Object.entries(colors)) {
    light.push(`  --color-${name}: ${lightValue};`);
    dark.push(`  --color-${name}: ${darkValue};`);
  }
  return { light, dark };
}

/**
 * fontSize: { "text-caption": { value, lineHeight, weight } } -> Tailwind v4's font-size
 * namespace is literally `--text-*`, and these keys already carry the `text-` prefix
 * (e.g. "text-caption"), so the JSON key becomes the CSS variable name unmodified:
 * `--text-caption: 16px;`. A companion `--text-<name>--line-height` variable sets the
 * paired line-height Tailwind applies automatically with the `text-<name>` utility.
 */
function buildFontSizeLines(fontSize) {
  const lines = [];
  for (const [name, def] of Object.entries(fontSize)) {
    lines.push(`  --${name}: ${def.value};`);
    lines.push(`  --${name}--line-height: ${def.lineHeight};`);
    if (def.weight !== undefined) {
      lines.push(`  --${name}--font-weight: ${def.weight};`);
    }
  }
  return lines;
}

/** fontFamily: { ui, mono } -> Tailwind's font-family namespace is `--font-*`. */
function buildFontFamilyLines(fontFamily) {
  return Object.entries(fontFamily).map(
    ([name, value]) => `  --font-${name}: ${value};`,
  );
}

/**
 * spacing: { "space-1": "4px" } -> Tailwind's spacing namespace is `--spacing-*`, a
 * different word than our "space-" key prefix, so nothing collides with Tailwind's
 * own default numeric scale. Keys are kept intact: `--spacing-space-1: 4px;` ->
 * utility `p-space-1`.
 */
function buildSpacingLines(spacing) {
  return Object.entries(spacing).map(
    ([name, value]) => `  --spacing-${name}: ${value};`,
  );
}

/**
 * radius: { "radius-sm": "8px" } -> Tailwind's radius namespace is `--radius-*`, the
 * same word already used as this token family's own key prefix, so it is stripped
 * before re-adding it once: `--radius-sm: 8px;` -> utility `rounded-sm`. This
 * intentionally redefines Tailwind's built-in `rounded-*` scale to the design system's
 * values, which is the point of decision 2 ("the generated token file *is* the utility
 * vocabulary").
 */
function buildRadiusLines(radius) {
  return Object.entries(radius).map(([name, value]) => {
    const stripped = name.startsWith("radius-") ? name.slice("radius-".length) : name;
    return `  --radius-${stripped}: ${value};`;
  });
}

/**
 * touchTarget: { floor, primary-standard, ... } -> exposed under the spacing namespace
 * with a `touch-` prefix so components can reach it as `min-h-touch-floor` etc,
 * without colliding with the numeric `space-N` scale above.
 */
function buildTouchTargetLines(touchTarget) {
  return Object.entries(touchTarget).map(
    ([name, value]) => `  --spacing-touch-${name}: ${value};`,
  );
}

/**
 * elevation: composite tokens (fill + border + optional shadow) referencing color
 * tokens by name. These aren't single scalar values, so they can't become @theme
 * utilities on their own — they're emitted as plain CSS custom properties for a
 * future `@utility` layer to consume, per ADR 005 #1's "complex thing gets a named
 * class" carve-out. Building that utility layer is out of scope for this pipeline.
 */
function buildElevationLines(elevation) {
  const lines = [];
  for (const [name, def] of Object.entries(elevation)) {
    lines.push(`  --elevation-${name}-fill: var(--color-${def.fill});`);
    lines.push(`  --elevation-${name}-border: ${resolveBorder(def.border)};`);
    if (def.shadow) {
      lines.push(`  --elevation-${name}-shadow: ${def.shadow};`);
    }
  }
  return lines;
}

function resolveBorder(border) {
  if (border === "none") return "none";
  // "1px hairline" -> "1px solid var(--color-hairline)"
  const match = border.match(/^(\S+)\s+(\S+)$/);
  if (!match) return border;
  const [, width, colorName] = match;
  return `${width} solid var(--color-${colorName})`;
}

/**
 * opacity: { "disabled": "0.45" } -> plain scalar tokens under Tailwind's `--opacity-*`
 * namespace, e.g. `--opacity-disabled: 0.45;`. Used for the global disabled treatment
 * (docs/design/06-accessibility-baseline.md); see src/core/design/tokens.test.ts.
 */
function buildOpacityLines(opacity) {
  return Object.entries(opacity).map(([name, value]) => `  --opacity-${name}: ${value};`);
}

function generate(tokens) {
  const { color, fontSize, fontFamily, spacing, radius, touchTarget, elevation, opacity } =
    tokens;

  const { light: colorLight, dark: colorDark } = buildColorLines(color);

  const themeLines = [
    ...colorLight,
    "",
    ...buildFontFamilyLines(fontFamily),
    "",
    ...buildFontSizeLines(fontSize),
    "",
    ...buildSpacingLines(spacing),
    ...buildTouchTargetLines(touchTarget),
    "",
    ...buildRadiusLines(radius),
    ...(opacity ? ["", ...buildOpacityLines(opacity)] : []),
  ];

  const parts = [];
  parts.push(cssComment("GENERATED FILE. Do not hand-edit."));
  parts.push(cssComment(`Source: src/core/design/tokens.json. Run \`npm run tokens\` to regenerate.`));
  if (tokens.$darkOnlyByDesign) {
    parts.push(cssComment("This product is dark-only in V1 — see $darkOnlyByDesign in tokens.json."));
  }
  parts.push("");
  parts.push("@theme {");
  parts.push(...themeLines.map((line) => (line === "" ? "" : line)));
  parts.push("}");
  parts.push("");
  parts.push(cssComment("Dark-mode overrides. Currently identical to light — see $darkOnlyByDesign."));
  parts.push("@media (prefers-color-scheme: dark) {");
  parts.push("  :root {");
  parts.push(...colorDark.map((line) => `  ${line}`));
  parts.push("  }");
  parts.push("}");
  parts.push("");
  parts.push(cssComment("Composite tokens (fill + border + shadow). Not @theme utilities; see buildElevationLines."));
  parts.push(":root {");
  parts.push(...buildElevationLines(elevation));
  parts.push("}");
  parts.push("");

  return parts.join("\n");
}

function main() {
  const tokens = readTokens();
  for (const key of Object.keys(tokens)) {
    if (key.startsWith("$") && !METADATA_KEYS.has(key)) {
      throw new Error(
        `tokens.json has an unrecognized metadata key "${key}". ` +
          `Add it to METADATA_KEYS in scripts/tokens.mjs or remove it before generating.`,
      );
    }
  }
  const css = generate(tokens);
  writeFileSync(OUTPUT_PATH, css);
  console.log(`Wrote ${path.relative(repoRoot, OUTPUT_PATH)}`);
}

main();
