
### 2026-08-28 | architect -> ux-ui
D20 lands one new screen on you and it is a small one. A saltwater Spot now needs its
coastline orientation captured **once, at creation** — a two-headed arrow the user drags
along the beach, then a tap on the water side. Two gestures, never asked again. That is
the entire cost of storing current direction as a real compass bearing instead of a
loose label. At logging time nothing changes: the angler still taps uphill / downhill /
inshore / offshore and never sees a degree. Freshwater spots must not show this step at
all — a lake has no coastline axis. Detail in `docs/architecture/ontology.md` §3.1.

