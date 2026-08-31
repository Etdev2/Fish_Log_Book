# Tide chart

**Status:** design approved by the founder, 2026-08-28; built and refined through 2026-08-30.
**Owner:** `ux-ui` for the design, `head-dev` for the eventual React port.
**Prototype:** `prototypes/tide-chart.html` — open it in a browser. Also published at
https://claude.ai/code/artifact/b3f59bc6-5951-4191-a2c6-a23f1f8afc06

The founder's words on the prototype: *"that's the design I like"*, with continuous
multi-day swiping added as the one change. Treat the shape below as settled and the
open items at the end as the remaining work.

## The decisions that matter

**One continuous curve, not a day at a time.** Tide does not reset at midnight, and a
chart that boxes each day into its own panel tells a lie about the data. The curve runs
unbroken across the whole cached window; midnight is a dashed divider with a date tag,
not a boundary. Panning is free and horizontal, with momentum on touch.

**Swipe is not the only way through.** A prev-day / next-day pair and a NOW button sit
above the chart at 52px. Someone with one hand on a rail or a rod cannot always drag
accurately on a moving boat, and swipe-only would make the chart unusable exactly when
it matters. NOW returns to the present from anywhere.

**The state tiles always describe now, never the scrolled day.** Height, flood/ebb with
rate, next high, and today's range. Scrolling to Thursday must not change what the app
says the tide is doing at this moment — that is the one number an angler acts on.

**Hourly samples with the exact turning points kept.** NOAA publishes 6-minute
predictions: 240 points a day, 720 across the cached window. This renders 78. Plain
hourly bucketing would round off the highs and lows, which are the only points anglers
actually plan around, so the true extrema are inserted at their real times alongside
the hourly samples. This follows the biostatistician's warning in
`docs/team/channel/2026-08-28-04-biostat-to-architect.md`.

**Highs and lows are directly labelled; nothing else is.** Height and clock time sit on
each turning point. A number on every sample is noise.

**Reading the curve works three ways.** Mouse hover, touch press-and-hold (260ms, so it
never steals a swipe), and keyboard arrows with a live `aria-valuetext`. Hover is never
load-bearing — see `03-touch-and-interaction.md`.

**The curve is Catmull-Rom smoothed into cubic beziers** so water reads like water. The
smoothing is visual only; every plotted point is a real prediction, and the table view
shows the underlying numbers.

## Moon and chart calendar refinement — 2026-08-30

**The moon follows the chart, not the wall clock.** Swiping the cached window updates a
native SVG phase mask from the astro engine at the chart's centered instant. A detailed
lunar surface texture remains fixed beneath it while the illuminated shape changes
continuously rather than jumping among eight stock icons: the bright limb is circular,
the terminator changes curvature from crescent through quarter to gibbous, waxing and
waning mirror correctly, and the exact illumination stays visible beside the phase name.

**The calendar never promises data that is not loaded.** It is a horizontal station-day
calendar made only from the cached prediction window. Each day has its own moon preview.
Choosing a day moves the selected point and centers the curve; swiping the curve moves the
active calendar day and keeps that day visible. Dates outside the cache are omitted rather
than shown as if the app could open them.

## Day and night transition refinement — 2026-08-30

Sunrise and sunset must never share an ambiguous generic sun marker. Sunrise uses an
amber rising-arrow horizon symbol and means daylight begins; sunset uses an orange
falling-arrow horizon symbol and means darkness follows. Their visible curve labels carry
the same up/down direction, and the chart key names both consequences explicitly. The
scroll-linked moon readout also states whether the centered time is daylight, twilight,
or night, so the meaning does not depend on colour or background shading alone.

## Colour

Single series, so no legend box is needed for identity — the title names it.

`tide-cyan` carries the curve, which is the whole point of reserving it
(`02-semantic-colors.md`): cyan on this screen is always tide, with no disambiguation.
The area fill is the same hue at 30% falling to 0.

**The NOW marker is `signal-orange`, deliberately not `amber-flag`.** Running the
palette through a CVD validator returned `amber-flag #E8B55F` against
`moon-pale #E8D9A8` at ΔE 10.1 for *normal* vision — below the 15 floor, meaning
full-colour readers struggle to tell them apart, before colourblindness is considered.
The tide screen is exactly where moon and tide data sit together. See the open item
below; this is a real defect in the token set, not a chart-local choice.

## Honesty

The badge reads **"Cached prediction — not a live reading."** D25 fetches tide ahead of
a trip and caches it. A chart that implies a live feed, to someone offshore with no
signal, is the kind of lie that loses trust permanently.

## Accessibility

18px body floor. 68px table toggle, 52px day controls. Every status carries a glyph as
well as colour (▲ ▼ — for flood, ebb, slack). The scroller is a focusable `slider` with
a live text value. A full table view of the same numbers is one tap away. Reduced motion
disables smooth scrolling and the tooltip fade.

## Open — the "little more work" still to do

1. **The amber / moon-pale collision above.** Fix in `01-foundations.md` and
   `src/core/design/tokens.json` before more screens inherit it. Owner: `ux-ui`.
2. **Real data.** The prototype embeds real NOAA predictions for station 9410580 as a
   fixture. The live cached-tide path is the Codex lane — see
   `docs/team/handoffs/AWAITING_CODEX-test-runner-and-conditions.md`.
3. **Port to React** as `src/features/conditions/tide-chart.tsx`, inline SVG. ADR 005
   bars chart libraries, and nothing here needs one.
4. **Resolved 2026-08-30 — sunrise / sunset shading.** The conditions engine now drives
   explicit daylight, twilight, and night bands plus distinct directional transition
   markers — anglers can read the light change without interpreting colour alone.
5. **More than one station.** Station is hardcoded. A picker is a separate decision.
6. **Not yet checked on a real iPhone**, only at an iPhone-sized viewport.
