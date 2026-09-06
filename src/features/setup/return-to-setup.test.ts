import { describe, expect, it } from "vitest";

import { setupStepHref } from "./return-to-setup";

/**
 * The link that carries an angler out of guided setup and knows how to bring them back.
 *
 * Worth a test for one reason: the first version of this appended to the string, which
 * turns `/settings#fishing-region` into `/settings#fishing-region?from=setup&step=region`.
 * That URL is not wrong-looking. It loads, it scrolls to the right section, and the
 * failure is entirely invisible — the query is inside the fragment, so no screen ever sees
 * the errand, the "back to setup" bar never appears, and choosing a region leaves you
 * standing in Settings exactly as before. The bug this whole round exists to fix would
 * have shipped again, silently.
 */
describe("setupStepHref", () => {
  it("keeps the fragment a fragment and the query a query", () => {
    expect(setupStepHref("/settings#fishing-region", "region")).toBe(
      "/settings?from=setup&step=region#fishing-region",
    );
  });

  it("tags a plain path", () => {
    expect(setupStepHref("/tackle", "tackle")).toBe("/tackle?from=setup&step=tackle");
  });

  it("merges with a query the step already carried", () => {
    const href = setupStepHref("/log?add=2026-09-06", "catch");
    const params = new URL(href, "https://example.test").searchParams;
    expect(params.get("add")).toBe("2026-09-06");
    expect(params.get("from")).toBe("setup");
    expect(params.get("step")).toBe("catch");
  });

  it("tags every real step, fragments and all", () => {
    // Guards the pairing rather than the strings: a step whose href grows a fragment
    // later must not quietly stop being taggable.
    for (const href of ["/settings#tide-station", "/setup#todays-rods", "/log"]) {
      const tagged = setupStepHref(href, "rod");
      const url = new URL(tagged, "https://example.test");
      expect(url.searchParams.get("from")).toBe("setup");
      expect(url.pathname).toBe(href.split("#")[0].split("?")[0]);
      expect(url.hash).toBe(href.includes("#") ? `#${href.split("#")[1]}` : "");
    }
  });
});
