import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  HOST_ROLES,
  HOST_ROLE_LABEL,
  HOST_ROLE_SUMMARY,
  hostCapabilities,
  type HostCapabilities,
  type HostRole,
} from "./host-role";

/**
 * The screen's capability table and the database's policies are two statements of the same
 * rule, written a week apart in two languages, and nothing but this file stops them
 * drifting. Drift here is not a crash: it is a treasurer who is shown a "Approve a payout"
 * button that errors, or worse, a lane hidden from somebody the database would have let in.
 *
 * So the roles are read out of the migration text and compared to the table. If a later
 * migration adds FINANCE to judging, or drops STAFF from the roster, the test names the
 * policy and the capability that no longer agree.
 */

const migrationsDir = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));

const sqlByFile = new Map<string, string>(
  readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .map((name) => [name, readFileSync(`${migrationsDir}${name}`, "utf8")]),
);

/** The whole migration corpus, newest last — policies are replaced, so later wins. */
const allSql = [...sqlByFile.keys()].sort().map((name) => sqlByFile.get(name) ?? "");

/**
 * The last `array[...]` role list attached to a named policy, across every migration in
 * order. Later files replace earlier ones, which is how the host-roles migration takes
 * effect, so reading the last occurrence is reading the live rule.
 */
function rolesForPolicy(policyName: string): readonly string[] | null {
  let found: readonly string[] | null = null;

  for (const sql of allSql) {
    const pattern = new RegExp(
      `create policy ${policyName}\\b[\\s\\S]*?(?=\\ncreate policy |\\ndrop policy |\\ncreate trigger |\\ncomment on |$)`,
      "gi",
    );
    for (const block of sql.match(pattern) ?? []) {
      const arrays = [...block.matchAll(/array\[([^\]]*)\]/gi)];
      if (arrays.length === 0) continue;
      // Every role array inside one policy must agree, or the policy is saying two
      // different things about who may act and the "expected" below is meaningless.
      const parsed = arrays.map((match) =>
        match[1]
          .split(",")
          .map((role) => role.trim().replace(/^'|'$/g, ""))
          .sort()
          .join(","),
      );
      expect(new Set(parsed).size, `${policyName} names conflicting role sets`).toBe(1);
      found = parsed[0].split(",");
    }
  }

  return found;
}

function rolesWith(capability: keyof HostCapabilities): readonly string[] {
  return HOST_ROLES.filter((role) => hostCapabilities(role)[capability]);
}

/** Policy → the capability in `host-role.ts` that must name exactly the same roles. */
const PARITY: ReadonlyArray<{ policy: string; capability: keyof HostCapabilities }> = [
  // Money, in every table the ledger is spread across.
  { policy: "tournament_order_owner_read", capability: "readMoney" },
  { policy: "tournament_order_owner_write", capability: "readMoney" },
  { policy: "tournament_order_item_read", capability: "readMoney" },
  { policy: "tournament_order_item_insert", capability: "readMoney" },
  { policy: "financial_org_read", capability: "readMoney" },
  { policy: "payment_attempt_read", capability: "readMoney" },
  { policy: "payment_allocation_read", capability: "readMoney" },
  { policy: "payment_refund_read", capability: "readMoney" },
  { policy: "platform_fee_admin_read", capability: "readMoney" },
  { policy: "financial_event_admin_read", capability: "readMoney" },
  { policy: "payout_instruction_finance_read", capability: "readMoney" },
  { policy: "payout_finance_read", capability: "readMoney" },
  { policy: "payout_event_finance_read", capability: "readMoney" },
  // Approving a payout is deliberately the same set as reading the money, and
  // deliberately not the same as running the event.
  { policy: "payout_instruction_finance_write", capability: "approvePayout" },
  // The roster.
  { policy: "tournament_entry_admin_write", capability: "writeRoster" },
  { policy: "tournament_team_org_write", capability: "writeRoster" },
  { policy: "tournament_boat_org_write", capability: "writeRoster" },
  // The event itself.
  { policy: "organization_member_insert_admin", capability: "manageStaff" },
  { policy: "organization_member_update_admin", capability: "manageStaff" },
  { policy: "organization_invitation_insert_admin", capability: "manageStaff" },
];

describe("host capabilities match the database policies", () => {
  it.each(PARITY)("$policy names exactly the roles with $capability", ({ policy, capability }) => {
    const actual = rolesForPolicy(policy);
    expect(actual, `no role array found for policy ${policy}`).not.toBeNull();
    expect([...(actual ?? [])].sort()).toEqual([...rolesWith(capability)].sort());
  });

  it("knows every role the check constraint allows", () => {
    const foundation = sqlByFile.get("20260905183000_tournament_organization_foundation.sql") ?? "";
    const constraint = /organization_member[\s\S]*?role text not null check \(role in \(([^)]*)\)\)/.exec(
      foundation,
    );
    expect(constraint, "organization_member.role check constraint not found").not.toBeNull();

    const allowed = (constraint?.[1] ?? "")
      .split(",")
      .map((role) => role.trim().replace(/^'|'$/g, ""))
      .sort();

    expect(allowed).toEqual([...HOST_ROLES].sort());
  });

  it("gives every role a name and a summary a person could read", () => {
    for (const role of HOST_ROLES) {
      expect(HOST_ROLE_LABEL[role].length).toBeGreaterThan(0);
      expect(HOST_ROLE_SUMMARY[role].length).toBeGreaterThan(0);
    }
  });

  it("grants FINANCE the money, which no policy did before this release", () => {
    // The regression this whole file exists to prevent coming back. FINANCE was in the
    // check constraint from the first migration and named by no policy at all, so the role
    // that exists for money could not read a single number.
    const finance: HostRole = "FINANCE";
    expect(hostCapabilities(finance).readMoney).toBe(true);
    expect(rolesForPolicy("financial_org_read")).toContain("FINANCE");
  });

  it("keeps the money and the fishing in different hands", () => {
    // A treasurer must not be able to judge a catch or change a rule, and event staff
    // must not be able to read the ledger. If either of these ever passes trivially,
    // somebody has widened a role rather than added one.
    const finance = hostCapabilities("FINANCE");
    expect(finance.judge).toBe(false);
    expect(finance.changeEventSettings).toBe(false);
    expect(finance.writeRoster).toBe(false);

    const staff = hostCapabilities("STAFF");
    expect(staff.readMoney).toBe(false);
    expect(staff.approvePayout).toBe(false);
    expect(staff.changeEventSettings).toBe(false);
  });
});
