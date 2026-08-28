# Design

`screens/` holds the source for the Fish Log Book screen-flow mockups — one `.dc.html`
file per screen, plus `canvas.json` for their layout.

Published canvas: https://claude.ai/code/artifact/86376b33-ee95-4dcc-959e-7acb95f7d91d

Eight screens, drawn from the decisions in `docs/product/ux-cold-start.md`:

| File | Screen |
|---|---|
| `Main.dc.html` | Home — saltwater, day one |
| `HomeLake.dc.html` | Home — lake / bass mode |
| `ActiveTrip.dc.html` | Active trip |
| `EndTrip.dc.html` | End trip, zero catches — the most important screen |
| `LockScreen.dc.html` | The retroactive check-in notification |
| `BassSheet.dc.html` | Bass post-catch sheet |
| `BiteScore.dc.html` | Bite score below threshold (V2) |
| `Watch.dc.html` | Apple Watch |

**Visual language** (chosen, not inherited — the repo has no design system yet):
dark marine-instrument. Background `#0A1014`, surface `#121A20`, hairline `#26333C`.
Signal orange `#FF7A18` for anything tappable, cyan `#3FC7E0` reserved for tide data only,
pale `#E8D9A8` for moon. Archivo for UI, IBM Plex Mono for measurements.
Primary targets 68–88px — well past the 44px floor, because this gets tapped with cold wet
hands in glare.

These are static mockups, not a prototype.
