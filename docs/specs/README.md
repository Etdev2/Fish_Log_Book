# Specs index

Founder-supplied and team-written specifications. Each file is the detailed source of
truth for one feature area. `docs/product/SPEC.md` remains the product-wide source of
truth; ADRs in `docs/architecture/decisions/` record structural rulings that specs then
implement.

**Read the spec before touching its feature area.** If a spec and a roadmap entry
disagree, the newer founder-dated document wins, and the conflict gets recorded in both
files rather than silently resolved.

| Spec | Status | What it covers |
|---|---|---|
| [fishing-passport-wildlife-boat-games.md](fishing-passport-wildlife-boat-games.md) | **Proposed** — planning only, nothing built | Fishing Passport / My Species, badges and verification levels, marine wildlife sightings, reusable Fin ID, private Boat Games. Phase 1 = Passport + starter badges. **Read §44–§47 first** — repo reality check, three blocked items, and the sequencing recommendation. |
| [setup-flow-and-quiver.md](setup-flow-and-quiver.md) | **Proposed** — awaiting architect + UX rulings | Guided five-step setup workflow, the Quiver (saved rod setups), reel sizes by reel type, Fish Legal region emphasis. **Read §5 first** — the repository reality check, including that the boundaries page shows a *Florida* map to every non-California region. |
| [tackle-box.md](tackle-box.md) | MVP / ready for implementation | Personal tackle inventory: two-level item model, search, and gear snapshots on a catch. |
| [fish-legal-expansion.md](fish-legal-expansion.md) | Shipped (Phases 1–3, PR #24) | Region-aware rules and regulations surface: packs, verdicts, citation-or-nothing. |
| [regulations-architecture.md](regulations-architecture.md) | Proposed architecture | How regulation data is packaged, versioned, and served offline. |
| [regulations-data-model.md](regulations-data-model.md) | Proposed; SoCal dataset landed | `reg_area` / `reg_group` / `reg_pack` / `reg_rule` field meanings. |
| [regulations-socal-research.md](regulations-socal-research.md) | Research findings | Sourced Southern California ocean sport fishing rules behind the SoCal pack. |
| [rockfish-identification.md](rockfish-identification.md) | Draft for implementation | Rockfish reference data and decision tree. Biology only. Absorbed by Fin ID later — see the passport spec §17. |

## Adding a spec

1. File it here, in `docs/specs/`, not in a chat message.
2. Give it the frontmatter block the newer specs use: `date`, `status`, `governs`,
   `extends`, `supersedes`.
3. Add a row to the table above.
4. If it contradicts a decision already recorded in `docs/product/ROADMAP.md`,
   `docs/product/SPEC.md`, or an ADR, say so in both documents.
5. Tell the roles it affects through `docs/team/channel/`.
