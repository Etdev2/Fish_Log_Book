import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  setLoad: vi.fn(),
  failure: "",
}));

vi.mock("react", () => ({
  useState: (initial: unknown) => [initial, state.setLoad],
  useEffect: (effect: () => void) => effect(),
}));
vi.mock("../demo-store", () => ({ hasSupabaseBrowserConfig: () => true }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      const data: Record<string, unknown[]> = {
        tournament_entry: [{ id: "entry", team_id: "team", registration_status: "CONFIRMED" }],
        tournament_entry_identity: [{ tournament_entry_id: "entry", display_name: "Captain", phone: null }],
        tournament_team_member: [{ tournament_entry_id: "entry", tournament_team_id: "team", role: "CAPTAIN" }],
        tournament_team: [{ id: "team", name: "Crew" }],
      };
      const result = () => Promise.resolve(table === state.failure
        ? { data: null, error: { message: `${table} unavailable` } }
        : { data: data[table], error: null });
      return { select: () => ({ eq: () => ({ is: result }), in: result }) };
    },
  }),
}));

import { useRoster } from "./use-roster";

beforeEach(() => { state.failure = ""; state.setLoad.mockClear(); });

describe("roster query failures", () => {
  it.each(["tournament_entry", "tournament_entry_identity", "tournament_team_member", "tournament_team"])(
    "reports %s failure instead of a partial roster", async (table) => {
      state.failure = table;
      useRoster("tournament", true);
      await vi.waitFor(() => expect(state.setLoad).toHaveBeenLastCalledWith({
        state: "error", message: `${table} unavailable`,
      }));
      expect(state.setLoad.mock.calls.some(([load]) => load.state === "ready")).toBe(false);
    },
  );

  it("keeps a successful crew name and captain", async () => {
    useRoster("tournament", true);
    await vi.waitFor(() => expect(state.setLoad).toHaveBeenLastCalledWith({
      state: "ready", boats: [{
        id: "team", name: "Crew", confirmed: true,
        crew: [{ id: "entry", displayName: "Captain", phone: null, captain: true, status: "CONFIRMED" }],
      }],
    }));
  });
});
