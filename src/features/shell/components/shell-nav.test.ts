import { describe, expect, it } from "vitest";

import { SHELL_ROUTES } from "./shell-nav";

describe("shell navigation", () => {
  it("offers Fish ID beside Log — identify it, then log it (UI-1 #12: Setup is one-time and lives in the Menu)", () => {
    const hrefs = SHELL_ROUTES.map((route) => route.href);
    expect(hrefs).toContain("/fish-id");
    expect(hrefs).not.toContain("/setup");
    expect(hrefs.indexOf("/fish-id")).toBe(hrefs.indexOf("/log") - 1);
  });

  it("stays at six destinations — the sixth ('Legal', the Fish Legal spec §2's rename) was the founder's call (spec §16); a seventh still needs a decision, not a patch", () => {
    expect(SHELL_ROUTES.length).toBeLessThanOrEqual(6);
    expect(SHELL_ROUTES).toContainEqual({ href: "/fish-legal", label: "Legal" });
  });

  it("links to the tide chart and does not advertise unfinished Spots or the unlinked Learn & Build route", () => {
    expect(SHELL_ROUTES).toContainEqual({ href: "/tides", label: "Tide" });
    expect(SHELL_ROUTES.map((route) => route.href)).not.toContain("/spots");
    expect(SHELL_ROUTES.map((route) => route.href)).not.toContain("/learn");
  });
});
