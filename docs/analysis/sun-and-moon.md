# Sun and moon: what these numbers mean, and what they do not

**Owner:** biostat · **Written:** 2026-08-29 · **Code:** `src/core/rules/astro/`
**Vectors:** `src/core/rules/vectors/astro.json` · **Interface fixed by:** ADR 006 §2

This is the plain-English version of the sun and moon maths. `ux-ui` writes the on-screen
words from this file, not from the code. If a sentence here is wrong, the screen is wrong.

---

## 1. What we actually compute

Three things, and nothing else.

**Sun events for a day.** Sunrise, sunset, the start and end of civil twilight, and solar
noon, for one place. Solar noon is when the sun is highest, which is usually *not* 12:00 on
anyone's clock.

**Daylight bands for a stretch of time.** The same information rearranged into a list of
"from here to here it was night / twilight / daylight", so the chart can shade its
background. This is the same fact told twice; it is not a second, independent estimate.

**Moon phase.** How much of the moon's disc is lit, how many days it has been since the new
moon, and a name for that.

All three are pure astronomy. They are computed from the date, and for the sun from the
latitude and longitude. Nothing about the ocean, the weather, or the fish enters into them.

## 2. Where the numbers come from and how good they are

The sun calculation is NOAA's published solar-position algorithm; the moon calculation is
the standard low-precision lunar phase formula from Meeus's *Astronomical Algorithms*. Both
are implemented in this repository rather than fetched from a service, because the phase of
the moon does not need a network connection, a paid API key, or a privacy review.

We checked them against the U.S. Naval Observatory, which is the authority:

| What | Checked against | Worst disagreement |
|---|---|---|
| Sun event times | 514 USNO events, 10 places from Singapore to Tromsø, 1905 to 2050 | 34 seconds, of which up to 30 is the USNO's own rounding to the minute |
| Moon illumination | 148 USNO phase instants across 2000, 2026, 2050 | 0.0034, i.e. a third of a percentage point |
| Moon age | the same 148 | about half an hour, i.e. 0.02 days |

So: **sun times are good to well under a minute; moon illumination is good to well under a
percentage point.** That is far more precision than a fishing app needs, and we stopped
there deliberately rather than chasing seconds.

Two honest limits:

- **Above about 65° of latitude the *times* get soft.** Near the poles the sun approaches
  the horizon at a shallow angle, so being slightly wrong about its height makes you quite
  wrong about the time. Whether the sun rises at all on a given day stays reliable.
- **Refraction is a convention, not a measurement.** "Sunrise" everywhere in the world means
  the moment the sun's upper edge would appear given *average* air. On a cold, still,
  high-pressure morning the real sunrise can be a minute or two off — off any calculation,
  including the Naval Observatory's. Nobody can do better without a weather balloon.

We ignore how high above sea level you are. For a fishing app that is the right assumption.

## 3. The things most likely to be miscommunicated on screen

### 3.1 "Full moon" is a moment, not a week

Strictly, "new moon", "first quarter", "full moon" and "last quarter" name *instants* — the
moon is exactly full for no longer than it is exactly noon. Almanacs keep it that way and
call everything in between "waxing crescent" or "waning gibbous".

A chart needs a word for every moment, so **we widened each of those four instants into a
window, by splitting the lunar cycle into eight equal slices.** This is an arbitrary choice
and we are saying so out loud. Its consequence is that we call the moon "full" for about
3.7 days, including nearly two days either side when it is visibly not full.

**Therefore: never show the phase name on its own.** Show the illumination percentage next
to it. "Full moon — 94% lit" is honest. "Full moon" alone is not.

### 3.2 Moon age can read slightly over 29.53 days

The average lunar month is 29.53 days, but real ones run from 29.27 to 29.83. We report the
time actually elapsed since the last new moon, so occasionally it reads 29.7. We do not
round it down to fit the average, because that would be inventing a number.

### 3.3 The time on screen is the *fishing spot's* time, not the phone's

Everything in the engine is UTC. Turning that into "06:09" is the display layer's job, and
it must use the time zone of the place being described. A user in California looking at a
Rhode Island station must see Rhode Island's clock. This is the single most likely source of
an embarrassing off-by-hours bug in the app.

Daylight saving cannot break the astronomy, because there is no local clock inside the
engine to spring forward. It can absolutely break the display.

### 3.4 A sun time is a calculation, not an observation

Nothing here was measured. It is all derived from a date and a position. That is fine — it
is derived very accurately — but it means a sunrise time is the same *kind* of thing as an
estimated tide slack window, not the same kind of thing as a published NOAA tide prediction.
If the UI badges provenance anywhere, it should not imply that these were reported by
someone with an instrument.

## 4. What this cannot tell you — the part that matters

None of this says anything about fish. It is worth being blunt, because the temptation to
imply otherwise is exactly what this app has to resist.

**A moon phase is not a fishing forecast.** There is a long folk tradition, and a genuinely
plausible mechanism (moonlight and tidal range both vary with phase), but the published
evidence is thin, contradictory, and mostly confounded. Any pattern *this app* eventually
shows a user will be from that user's own trip log, which brings its own problems:

- **Effort is the denominator.** People fish more on weekends, in summer, and in nice
  weather. Counting catches by moon phase measures when someone went fishing, not when the
  fish were biting. Anything we report must be catch *per hour fished*.
- **Everything is tangled together.** Moon phase drives tidal range. Tidal range drives
  where it is safe to fish. Season drives daylight length, water temperature, and which
  species are even present. A "full moon effect" is very likely a tide effect, a season
  effect, or a "which weekend was I free" effect wearing a costume.
- **Eight phases is eight comparisons.** Testing catch rate against eight phase buckets will
  produce an apparently significant result about a third of the time by chance alone, before
  you have added tide state, pressure, or wind. Either correct for that or do not print a
  p-value.
- **Small numbers.** Below the trip threshold set in the analysis rules, the app says "not
  enough trips yet". It does not show a faint trend with a shrug. A weak signal presented
  gently is still a wrong answer at 4 a.m.

**What the sun and moon layer is honestly for, today:** context. It tells you that the tide
turn you are looking at happens forty minutes after sunset, and it shades the chart so you
can see that at a glance. That is a genuinely useful, entirely factual thing, and it makes
no claim about fish at all. Any step beyond that belongs in the scoring work, with its own
analysis document and its own confidence intervals.

## 5. Copy the UI must not write

- **Never:** "Best fishing: full moon" — we have not shown that, for this user or anyone.
- **Never:** "Fish bite more on a rising tide during a new moon" — causal claim, no evidence.
- **Never:** "Full moon" as a standalone label — see §3.1; pair it with the percentage.
- **Never:** "Sunrise 06:09" without saying whose clock that is — see §3.3.
- **Fine:** "Sunset 19:24 (Newport, RI) — the evening high tide turns 40 minutes after."
- **Fine:** "Waxing gibbous, 78% lit."
- **Fine:** "We don't have enough of your trips yet to say anything about moon phase."
