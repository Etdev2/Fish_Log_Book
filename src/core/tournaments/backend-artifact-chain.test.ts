import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migrationsDir = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));
const migrationNames = readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort();

const requiredMigrationChain = [
  "20260905183000_tournament_organization_foundation.sql",
  "20260905184500_tournament_core.sql",
  "20260905190000_tournament_registration.sql",
  "20260905190500_tournament_registration_integrity.sql",
  "20260905193000_tournament_catch_evidence.sql",
  "20260905193500_tournament_fair_play.sql",
  "20260905193700_tournament_adjudication.sql",
  "20260905194000_tournament_scoring.sql",
  "20260905195500_tournament_public_projections.sql",
  "20260905200000_tournament_self_registration.sql",
  "20260905201000_tournament_payment_domain.sql",
  "20260905202500_tournament_stripe_provider.sql",
  "20260905204000_tournament_crypto_provider.sql",
  "20260905205500_tournament_prize_payouts.sql",
] as const;

const requiredContractFiles = [
  "official-scoring.ts",
  "official-scoring.test.ts",
  "public-projection.ts",
  "public-projection.test.ts",
  "stripe-provider.ts",
  "stripe-provider.test.ts",
  "crypto-provider.ts",
  "crypto-provider.test.ts",
] as const;

describe("canonical tournament backend artifact chain", () => {
  it("keeps every reviewed T-001–T-008 and PAY-001–PAY-004 migration on the integration branch", () => {
    for (const name of requiredMigrationChain) {
      expect(migrationNames, `${name} is missing from the canonical tournament migration chain`).toContain(name);
    }
  });

  it("keeps dependency order encoded by migration filenames", () => {
    const positions = requiredMigrationChain.map((name) => migrationNames.indexOf(name));
    expect(positions.every((value) => value >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("keeps provider/scoring/public projection contracts that were reviewed with those migrations", () => {
    for (const name of requiredContractFiles) {
      const path = fileURLToPath(new URL(`./${name}`, import.meta.url));
      expect(existsSync(path), `${name} is missing from src/core/tournaments`).toBe(true);
    }
  });
});
