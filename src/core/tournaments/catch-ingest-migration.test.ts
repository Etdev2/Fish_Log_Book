import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
  new URL("../../../supabase/migrations/20260905211500_tournament_catch_ingest_hardening.sql", import.meta.url),
);
const sql = readFileSync(migrationPath, "utf8");

describe("tournament catch ingest SQL hardening", () => {
  it("authorizes the participant-owned entry path as well as organization membership", () => {
    expect(sql).toMatch(
      /is_organization_member\(p_organization_id\)[\s\S]*?or\s+public\.can_read_tournament_entry\(p_entry_id\)/i,
    );
  });

  it("validates the client supplied entry, tournament and organization relationship first", () => {
    expect(sql).toMatch(/e\.id\s*=\s*p_entry_id/i);
    expect(sql).toMatch(/e\.tournament_id\s*=\s*p_tournament_id/i);
    expect(sql).toMatch(/e\.organization_id\s*=\s*p_organization_id/i);
  });

  it("persists mismatch state without raising an exception that would roll it back", () => {
    const mismatchStart = sql.indexOf("-- Mismatched retry:");
    const newInsertStart = sql.indexOf("insert into public.tournament_catch (", mismatchStart);

    expect(mismatchStart).toBeGreaterThan(-1);
    expect(newInsertStart).toBeGreaterThan(mismatchStart);

    const mismatchBranch = sql.slice(mismatchStart, newInsertStart);
    expect(mismatchBranch).toContain("insert into public.tournament_sync_conflict");
    expect(mismatchBranch).toContain("set sync_status = 'CONFLICT'");
    expect(mismatchBranch).toContain("return existing_row.id;");
    expect(mismatchBranch).not.toMatch(/raise\s+exception/i);
  });

  it("deduplicates delivery of the same unresolved mismatch", () => {
    expect(sql).toMatch(/c\.status\s*=\s*'OPEN'/i);
    expect(sql).toMatch(/c\.existing_snapshot\s*=\s*existing/i);
    expect(sql).toMatch(/c\.incoming_snapshot\s*=\s*incoming/i);
  });
});
