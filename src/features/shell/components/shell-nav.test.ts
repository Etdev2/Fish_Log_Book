import { describe, expect, it } from "vitest";

import { SHELL_ROUTES } from "./shell-nav";

describe("shell navigation", () => {
  it("links to the tide chart and does not advertise unfinished Spots or the unlinked Learn & Build route", () => {
    expect(SHELL_ROUTES).toContainEqual({ href: "/tides", label: "Tide" });
    expect(SHELL_ROUTES.map((route) => route.href)).not.toContain("/spots");
    expect(SHELL_ROUTES.map((route) => route.href)).not.toContain("/learn");
  });
});
