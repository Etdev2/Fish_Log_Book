import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
