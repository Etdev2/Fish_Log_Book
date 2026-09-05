import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
  new URL("../../../supabase/migrations/20260905212500_tournament_qr_hardening.sql", import.meta.url),
);
const sql = readFileSync(migrationPath, "utf8");

describe("tournament QR verification SQL hardening", () => {
  it("handles unknown tokens without attempting a tenantless scan insert", () => {
    const unknownStart = sql.indexOf("if token_row.id is null then");
    const targetValidationStart = sql.indexOf("if target_entry_id is not null", unknownStart);

    expect(unknownStart).toBeGreaterThan(-1);
    expect(targetValidationStart).toBeGreaterThan(unknownStart);

    const unknownBranch = sql.slice(unknownStart, targetValidationStart);
    expect(unknownBranch).toContain("reason_code := 'QR_UNKNOWN'");
    expect(unknownBranch).toContain("return;");
    expect(unknownBranch).not.toContain("insert into public.qr_verification_scan");
  });

  it("validates entry and catch targets against the token tenant and tournament", () => {
    expect(sql).toMatch(/e\.tournament_id\s*=\s*token_row\.tournament_id/i);
    expect(sql).toMatch(/e\.organization_id\s*=\s*token_row\.organization_id/i);
    expect(sql).toMatch(/catch_row\.tournament_id\s*<>\s*token_row\.tournament_id/i);
    expect(sql).toMatch(/catch_row\.organization_id\s*<>\s*token_row\.organization_id/i);
  });

  it("requires tournament staff or the participant who owns the targeted entry context", () => {
    expect(sql).toMatch(
      /is_organization_member\(token_row\.organization_id,[\s\S]*?or\s+\(resolved_entry_id is not null and public\.can_read_tournament_entry\(resolved_entry_id\)\)/i,
    );
    expect(sql).toContain("raise exception 'QR verification access denied'");
  });

  it("keeps exact scan retries idempotent before current token validity is reevaluated", () => {
    const replayStart = sql.indexOf("select * into existing_row");
    const validityStart = sql.indexOf("if token_row.revoked_at is not null", replayStart);

    expect(replayStart).toBeGreaterThan(-1);
    expect(validityStart).toBeGreaterThan(replayStart);

    const replayBranch = sql.slice(replayStart, validityStart);
    expect(replayBranch).toContain("return query select existing_row.id");
    expect(replayBranch).toContain("QR scan client id reused with different payload");
  });

  it("surfaces distinct token reuse as a warning and explainable Fair Play signal", () => {
    expect(sql).toContain("resolved_reason := 'QR_REUSED'");
    expect(sql).toContain("resolved_result := 'WARNING'");
    expect(sql).toMatch(/'QR_REUSED',[\s\S]*?'WARNING',[\s\S]*?'SERVER'/i);
    expect(sql).toContain("does not alter scoring");
  });
});
