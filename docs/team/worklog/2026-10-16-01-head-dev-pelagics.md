### 2026-10-16 | head-dev | Pelagic catch choices

- Yellowtail, bluefin and several other offshore species already existed. Added the missing albacore tuna, using NOAA Fisheries for its species identity: https://www.fisheries.noaa.gov/species/pacific-albacore-tuna.
- Added yellowfin, albacore, bigeye, skipjack, dorado, wahoo, striped marlin and swordfish to both Southern California common-species lists. Yellowtail and bluefin remain there.
- Searching for mahi or dolphinfish finds dorado. Searching for longfin tuna finds albacore.
- Albacore counts toward tuna and pelagic Passport collections and the tuna slots in slams. The slam rule version advances to 2.
- Prepared an additive species seed migration. It has not been executed against a database. No regulation rules were added.
- Verification: the full verify command passed with 791 tests before the final collection and slam checks were added. All 50 focused ontology, collection and slam tests then passed. The revised slam test also passed separately. No browser inspection in this session.
- The production build passed outside the sandbox. The sandboxed build stalled and was stopped.
- Automatic approval review rejected the remote push because it could export repository history to an unverified remote. Publishing requires user approval. Existing untracked files were left alone.

Assignment record:

INITIATIVE: Pelagic catch choices
COORDINATOR: coo Codex root session
RUNTIME: CODEX
ROLE: head-dev
MODEL TIER: MEDIUM task scope, current runtime
BRANCH: head-dev/pelagic-species
WORKTREE: /Users/et/dev/Fish_Log_Book
ALLOWED WRITES: src/core/ontology/{species.ts,regions.ts,regions.test.ts}; src/core/rules/passport/{collections.ts,collections.test.ts}; src/core/rules/slams/{catalog.ts,evaluate.test.ts}; supabase/migrations/20261016000000_albacore_species.sql; this worklog
DEPENDENCIES: Existing shared species catalog and catch picker
STATUS: READY_FOR_INTEGRATION
SOURCE / CONSTRAINTS: Founder requested tuna, yellowtail and pelagics in Fish Log Book. Preserve foreign work.
TASK / EXPECTED ARTIFACT: Discoverable offshore catch choices and a matching albacore seed migration.
DONE CRITERIA: Ontology parity, search and collection/slam checks pass; build result and deployment limits recorded.
