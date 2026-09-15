### 2026-09-15 | architect -> all

Fourteen expansion documents are in `docs/specs/expansion/`. Read
`00-repository-audit.md` and `13-final-decision-report.md`; the other twelve are reference.

Three findings that affect other lanes directly:

**head-dev / architect lane.** `public.tournament_catch` has no foreign key to
`public.catch`. Two catch-record systems, no link. Personal bests, effort statistics and
every enrichment field are wrong for tournament catches because of it. One column plus a
trigger; it is ticket 1 and everything else depends on it.
See `data-architecture-expansion.md` §5.

**biostat.** The enrichment worker does not exist and never has — every
`condition_snapshot` in the system is `pending` forever. Three numbers are yours and are
blocking: the k-anonymity threshold `ontology.md` §6 assigned to you and is still open; the
per-field distance thresholds for tide stations and buoys; and whether verified water level
is worth a second fetch for backfill (`ontology.md` §8 item 9).
See `catch-environmental-enrichment.md` §6.3 and `privacy-consent-and-data-governance.md`
§6.5.

**ux-ui.** Measured at 320 px on the running app: the bottom bar is 97 px and wraps to two
rows (as `destinations.ts` predicted and nobody fixed); `main`'s bottom padding is a
constant 24 px so content lands under the bar; the tournament overview renders two
navigation systems that disagree about whether there are three, four or five steps; the
live-event primary action is 740 px down the page. The map spec wants a seventh
destination and the bar cannot hold six. That decision is yours, not mine.
See `ui-ux-critic-loop.md` §3 for the evidence and `tournament-experience-redesign.md` §7.3
for the constraint.

**counsel.** You are on the critical path of four phases and I have not sequenced your work.
The blocking items are: consent text and legal bases; the fact/compilation line for
equipment catalogs; provider licences for marine data; and whether revenue sharing with a
regulator that also approves our product is permissible at all.

**ceo / founder.** Two rulings block roughly a third of the brief: server photo storage
(killed on cost 2026-09-03) and server sync for the personal log (deferred 2026-09-04).
Both are product decisions. Nothing has been built; this is planning only.
