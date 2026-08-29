import { describe, expect, it } from "vitest";

import { SHELL_ROUTES } from "./shell-nav";

describe("shell navigation", () => {
  it("links to the approved Learning Dashboard without advertising unfinished Spots", () => {
    expect(SHELL_ROUTES).toContainEqual({ href: "/learn", label: "Learn & Build" });
    expect(SHELL_ROUTES.map((route) => route.href)).not.toContain("/spots");
  });
});
