import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { ESLintUtils } from "@typescript-eslint/utils";

/*
 * The `Sourced<T>` tripwire (ADR 006 §5).
 *
 * `Sourced<T>` wraps a derived value with its provenance (`certainty`, `basis`). Reading
 * `.value` off it directly under `features/**` throws that provenance away — the only
 * sanctioned reader is `components/sourced-value.tsx`. A plain `no-restricted-syntax` ban
 * on the property name `.value` is not precise enough to ship: this codebase already reads
 * `.value` legitimately (e.g. an `Intl.DateTimeFormatPart`), and DOM inputs, refs, and event
 * targets all use the same property name. Those are unrelated shapes, not `Sourced<T>`, so
 * a syntax-only rule would cry wolf on every one of them.
 *
 * Because `@typescript-eslint`'s tooling is already a transitive dependency of
 * `eslint-config-next` (no new package added here), this is instead a small type-aware
 * rule: it only fires when the object being read has the actual shape of `Sourced<T>`
 * (`value`, `certainty`, and `basis` all present), which a DOM input or an
 * `Intl.DateTimeFormatPart` does not have.
 */
const noRawSourcedValue = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow reading `.value` directly off a Sourced<T> outside components/sourced-value.tsx (ADR 006 §5).",
    },
    schema: [],
    messages: {
      rawValue:
        "This reads `.value` off what looks like a Sourced<T>, which drops its certainty/basis (ADR 006 §5). " +
        "Render it through components/sourced-value.tsx instead of unwrapping it here.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context, /* allowWithoutFullTypeInformation */ true);
    if (!services.program) return {};
    return {
      MemberExpression(node) {
        if (node.property.type !== "Identifier" || node.property.name !== "value") return;
        if (node.computed) return;

        const type = services.getTypeAtLocation(node.object);
        const propertyNames = new Set(type.getProperties().map((symbol) => symbol.getName()));
        const looksSourced =
          propertyNames.has("value") && propertyNames.has("certainty") && propertyNames.has("basis");
        if (looksSourced) {
          context.report({ node: node.property, messageId: "rawValue" });
        }
      },
    };
  },
});

/*
 * The import tripwires from ADR 003 §6, extended by ADR 005 §5.
 *
 * "Until they are on, this ADR is a wish." They are on now.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // src/core/ is the spec the Swift client is built from. It is platform-agnostic, and
    // it stays that way only because this rule says so.
    files: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "next", "next/*", "@/app/*", "@/features/*", "@/lib/*"],
              message:
                "src/core/ is platform-agnostic (ADR 003 §6). It is what Swift is built from, so it may not import React, Next, or anything above it.",
            },
          ],
        },
      ],
    },
  },

  {
    // No component touches Supabase — it goes through a feature's query layer.
    files: ["src/app/**/*.{ts,tsx}", "src/**/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/*"],
              message:
                "Components and route files do not talk to Supabase (ADR 003 §6, ADR 005 §5). Go through features/<domain>/queries/. Allowlist: src/proxy.ts, src/lib/supabase/**, src/app/(auth)/**.",
            },
          ],
        },
      ],
    },
  },

  {
    // The allowlist from ADR 005 §5, and nothing else.
    files: ["src/proxy.ts", "src/lib/supabase/**/*.ts", "src/app/(auth)/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },

  {
    // Type-aware, so scoped narrowly to features/** rather than the whole tree.
    files: ["src/features/**/*.{ts,tsx}"],
    ignores: ["src/features/conditions/components/sourced-value.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { local: { rules: { "no-raw-sourced-value": noRawSourcedValue } } },
    rules: { "local/no-raw-sourced-value": "error" },
  },

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
