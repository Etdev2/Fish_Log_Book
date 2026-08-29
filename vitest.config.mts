import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/*
 * Vitest, chosen for ADR 005 §6's open "head-dev picks a runner".
 *
 * Reasons, briefly: it reads the same TS config and ESM the app already uses with no extra
 * transform layer; it runs plain Node tests for src/core/ (which has no DOM by law) without
 * a jsdom tax; and when the vector rule from ADR 003 §4 arrives, loading a JSON file off
 * disk in a test is a plain import. Nothing here is Vitest-specific enough to make swapping
 * it painful later.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
