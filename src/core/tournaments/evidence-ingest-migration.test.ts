import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
  new URL("../../../supabase/migrations/20260905212000_tournament_evidence_ingest_hardening.sql", import.meta.url),
);
const sql = readFileSync(migrationPath, "utf8");

describe("tournament evidence ingest SQL hardening", () => {
  it("authorizes the parent entry participant path as well as organization membership", () => {
    expect(sql).toMatch(
      /is_organization_member\(p_organization_id\)[\s\S]*?or\s+public\.can_read_tournament_entry\(parent_catch\.entry_id\)/i,
    );
  });

  it("validates evidence against the server-side parent catch tenant and tournament", () => {
    expect(sql).toMatch(/parent_catch\.tournament_id\s*<>\s*p_tournament_id/i);
    expect(sql).toMatch(/parent_catch\.organization_id\s*<>\s*p_organization_id/i);
  });

  it("treats an identical client retry as an idempotent replay", () => {
    expect(sql).toMatch(/if\s+existing\s*=\s*incoming\s+then[\s\S]*?return\s+existing_row\.id/i);
  });

  it("persists mismatched evidence without overwriting or throwing after the write", () => {
    const conflictInsert = sql.indexOf("insert into public.tournament_sync_conflict");
    const newEvidenceInsert = sql.indexOf("insert into public.catch_evidence (", conflictInsert);

    expect(conflictInsert).toBeGreaterThan(-1);
    expect(newEvidenceInsert).toBeGreaterThan(conflictInsert);

    const mismatchBranch = sql.slice(conflictInsert, newEvidenceInsert);
    expect(mismatchBranch).toContain("'CATCH_EVIDENCE'");
    expect(mismatchBranch).toContain("set sync_status = 'CONFLICT'");
    expect(mismatchBranch).toContain("return existing_row.id;");
    expect(mismatchBranch).not.toMatch(/raise\s+exception/i);
  });

  it("deduplicates the same unresolved evidence mismatch", () => {
    expect(sql).toMatch(/c\.status\s*=\s*'OPEN'/i);
    expect(sql).toMatch(/c\.existing_snapshot\s*=\s*existing/i);
    expect(sql).toMatch(/c\.incoming_snapshot\s*=\s*incoming/i);
  });
});
