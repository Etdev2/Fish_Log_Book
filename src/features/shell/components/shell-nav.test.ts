import { describe, expect, it } from "vitest";

import { FIN_ID } from "@/features/wildlife/flag";

import { SHELL_ROUTES } from "./shell-nav";

describe("shell navigation", () => {
  it("offers Fish ID beside Log — identify it, then log it (UI-1 #12: Setup is one-time and lives in the Menu)", () => {
    const hrefs = SHELL_ROUTES.map((route) => route.href);
    // With NEXT_PUBLIC_FIN_ID=off, Setup keeps the slot instead of leaving a hole.
    const [shown, hidden] = FIN_ID ? ["/fish-id", "/setup"] : ["/setup", "/fish-id"];
    expect(hrefs).toContain(shown);
    expect(hrefs).not.toContain(hidden);
    expect(hrefs.indexOf(shown)).toBe(hrefs.indexOf("/log") - 1);
  });

  it("stays at five equal tabs — Settings lives in the Menu (founder-approved); a sixth tab needs a decision, not a patch", () => {
    expect(SHELL_ROUTES.length).toBe(5);
    expect(SHELL_ROUTES.map((route) => route.href)).not.toContain("/settings");
    expect(SHELL_ROUTES).toContainEqual({ href: "/fish-legal", label: "Legal" });
  });

  it("links to the tide chart and does not advertise unfinished Spots or the unlinked Learn & Build route", () => {
    expect(SHELL_ROUTES).toContainEqual({ href: "/tides", label: "Tide" });
    expect(SHELL_ROUTES.map((route) => route.href)).not.toContain("/spots");
    expect(SHELL_ROUTES.map((route) => route.href)).not.toContain("/learn");
  });
});
