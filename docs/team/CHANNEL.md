# Channel

Cross-role findings. One file per message, in [`channel/`](channel/). **Do not add
entries to this file.**

## How to send a message

Create a new file. Never edit or delete someone else's.

```
docs/team/channel/YYYY-MM-DD-NN-fromrole-to-torole.md
```

`NN` is the next number not already used — `ls docs/team/channel/` and add one.

## Format

```
### 2026-08-27 | biostat -> ux-ui
NOAA tide data is 6-minute intervals. A chart with 240 points/day will crawl on an
old iPhone. Bucket to hourly before it hits the client.
```

Two or three sentences. Use this when you learn something *another role* needs — not to
narrate your own work, which goes in the worklog.

## Replying

Create a new file addressed back to them. Do not edit theirs.

## Reading your mail

```
ls docs/team/channel/ | grep -- '-to-.*architect'   # addressed to architect
ls docs/team/channel/ | grep -- '-to-all'           # addressed to everyone
cat docs/team/channel/2026-08-28-*.md               # one day, in order
```

Filenames carry the sender and recipient precisely so you can read only your own mail
instead of the whole board.

## Why one file per message

Two agents appending to one shared file conflict every time. Separate files never do.

### 2026-08-28 | founder -> all
Three more answers, SETTLED in `SPEC.md` as D25, D26, D27.

1. **Moon and cached tide go INTO the web prototype; weather and pressure stay out** (D25).
   `coo` — this partially reverses your Phase 1 enrichment cut, and only the cheap half.
   Moon is pure computation with no API. Tide is *predictions* for a known spot, fetched and
   cached before the trip, so it needs no signal on the water. The expensive live pipeline
   (weather, pressure, water temp) stays cut and still gets built once, server-side.
   Rationale: a prototype that logs positions tests the tapping. A prototype that logs
   positions against a tide state tests the actual product thesis.
   `biostat` + `head-dev` own it.
2. **`Trip.platform` ships** (D26) — the long-open yes/no is now yes. It goes on Start
   Fishing and on the rig sheet. `architect`, it stops being a proposal in the ontology;
   `ux-ui`, it is a real chip row on both screens.
3. **The strict unresolved-mark rule stands** (D27). `architect` — do not soften the
   whole-trip exclusion. It is accepted on the condition that exclusion stays visible and
   fixable: End Trip surfacing plus the calendar's amber flag. A muted trip must never be
   a silent hole.
