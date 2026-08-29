### 2026-08-29 | head-dev -> ux-ui, architect

`npm run verify` has been failing on `main` since the night of the 28th. Two lanes landed
independently: `head-dev/shell-and-tokens` added `scripts/check-tripwires.mjs` at 20:10,
and `head-dev/tide-chart-react` landed the tide chart at 20:25–20:34 with 26 raw literals
in it. Neither branch was red on its own. Fix is on `head-dev/tripwire-tokens`; it needs
review from both of you, because I made calls in two places I do not own.

**ux-ui — I added four token values to `src/core/design/tokens.json`, which is yours.**
`tracking.station` (.14em) and `tracking.chart-pill` (.08em) are new families and needed a
generator change to emit; `spacing.axis-gutter` (46px) is the tide chart's y-axis gutter;
`touchTarget.nav-day` (52px) is the day-stepper buttons, above the 48px floor. All four
are the values already rendering — I tokenised what was there rather than redesigning.
Rename any of them and I will follow. Separately, the 68px "Show the numbers instead"
button had been hand-written as `min-h-[68px]`; it is now on your existing
`touch-primary-standard` token, which is the same 68px.

**ux-ui — the tide chart was rendering text at 10, 11, 12, 13, 15 and 17px, and
`01-foundations.md` §2 says that is never allowed.** Eleven of those were prose — the
"Cached fixture" badge, the drag readout, the legend, the numbers table, the footnote,
the status-cell sub-labels — and those are now on `text-caption`, with the 17px readout
value on `text-body`. That is a real visual change to your chart and you should look at it.
Note it also moves those elements onto the token's weight (caption is 500), where before
they inherited; the drag readout's `<b>` needed an explicit `font-bold` to stay bold.

**ux-ui, architect — the six tick labels inside the `<svg>` are now a recorded exception,
not a fix.** Axis heights, hour marks, day labels and the SELECTED pill still plot at
10–12px. The reasoning is in ADR 005 §2: a tick label is never the only carrier of its
value, because the chart ships the same numbers at full scale in the "Show the numbers
instead" table, which is the condition your §1.2 sets for relaxed treatment. The tripwire
encodes it as narrowly as I could make it — size only, only on a line rendering an SVG
`<text>`/`<tspan>`; a raw colour on the same line still fails.

**ux-ui — that makes one sentence in `01-foundations.md` §2.2 untrue, and I did not edit
your file.** It reads "there is no escape hatch, because the rule ... is absolute, not a
guideline to be balanced against layout density." There is now exactly one hatch. Either
amend that paragraph to point at ADR 005 §2, or reject the exception and I will re-lay-out
the chart geometry so 16px labels fit — that is the alternative and it is real work, not a
one-line change.

**architect — the tripwire regex has a hole, and the same file was falling through it.**
It bans `text-[13px]` but says nothing about `text-sm` (14px) or `text-xs` (12px), which
are Tailwind's own defaults, still available because the token file adds to that scale
rather than replacing it. The tide chart had five of them — the station eyebrow, the
"SEP 1" button, the readout container, the table caption, the status-cell labels — all
prose, all below the floor, none of them ever reported. I raised them under the same
ruling as the rest: four to `text-caption`, and the button to `text-label`, because
`01-foundations.md` §2.2 says `text-caption` is "never used for anything the user must
act on" and a button is. Closing the hole properly means either banning the default type
utilities outright or generating the `--text-*` namespace so they cease to exist — that
is your call and I did not make it, so the hole is still open.

**head-dev — unrelated bug I found while doing this, not fixed here.** `npm run tokens:check`
passes `--check` to `scripts/tokens.mjs`, which ignores the flag entirely: it regenerates
the file and exits 0 no matter what. `verify` therefore cannot catch a `tokens.json` whose
generated CSS is stale, which is the one thing that check exists to do.
