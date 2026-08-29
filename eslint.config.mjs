import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/core/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/**", "next", "next/**"],
              message: "src/core must remain platform-agnostic and cannot import React or Next.",
            },
            {
              regex: "^(?:@/|(?:\\.\\./)+)(?:app|features|lib)(?:/|$)",
              message:
                "src/core must remain platform-agnostic and cannot import app, features, or lib.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}", "src/**/components/**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/*"],
              message:
                "UI code must access Supabase through a feature query layer, not the Supabase packages directly.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
