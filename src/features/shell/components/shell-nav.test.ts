import { describe, expect, it } from "vitest";

import { SHELL_ROUTES } from "./shell-nav";

describe("shell navigation", () => {
  it("offers Setup beside Log — configure once, log repeatedly", () => {
    const hrefs = SHELL_ROUTES.map((route) => route.href);
    expect(hrefs).toContain("/setup");
    expect(hrefs.indexOf("/setup")).toBe(hrefs.indexOf("/log") - 1);
  });

  it("stays at five destinations — a sixth needs a decision, not a patch", () => {
    expect(SHELL_ROUTES.length).toBeLessThanOrEqual(5);
  });

  it("links to the tide chart and does not advertise unfinished Spots or the unlinked Learn & Build route", () => {
    expect(SHELL_ROUTES).toContainEqual({ href: "/tides", label: "Tide" });
    expect(SHELL_ROUTES.map((route) => route.href)).not.toContain("/spots");
    expect(SHELL_ROUTES.map((route) => route.href)).not.toContain("/learn");
  });
});
