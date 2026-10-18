# FIX-002: Date picker shows yesterday in Pacific time

- Status: open
- Found by: coordinator, live run of `c2fc171` (https://github.com/Etdev2/Fish_Log_Book/pull/137#issuecomment-6225223200)
- Owner: #137 builder (Elliott may reassign)
- PR / branch: #137, `fl1/tides-2yr`

## What's wrong
At 2:38 PM PT on Friday Oct 16 the date picker said 10/15/2026, and the month view
highlighted Oct 15 just left of the TODAY line. An angler in California sees the wrong day.

## Proof
Coordinator's screenshots (on the coordinator machine). Suspected cause, not yet
confirmed: `nowMs` is floored to UTC midnight, then shown in the station's time zone.

## Done when
A test pins "now" to an afternoon in America/Los_Angeles and asserts the picker and
the month-view highlight both show that local date; a screenshot confirms it.
