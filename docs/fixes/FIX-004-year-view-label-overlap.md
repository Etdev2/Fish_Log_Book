# FIX-004: Year view month labels overlap at New Year

- Status: open
- Found by: coordinator, live run of `c2fc171` (https://github.com/Etdev2/Fish_Log_Book/pull/137#issuecomment-6225223200)
- Owner: #137 builder (Elliott may reassign)
- PR / branch: #137, `fl1/tides-2yr`

## What's wrong
In the year view, the month labels collide where the year changes: "Jan" runs into
"27Feb".

## Proof
Coordinator's screenshot of the year view (on the coordinator machine).

## Done when
A year-view screenshot spanning a New Year shows every month label readable with no
overlap.
