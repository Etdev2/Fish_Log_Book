# FIX-003: Tide toolbar range text cut off on phones

- Status: open
- Found by: coordinator, live run of `c2fc171` at 390 px width (https://github.com/Etdev2/Fish_Log_Book/pull/137#issuecomment-6225223200)
- Owner: #137 builder (Elliott may reassign)
- PR / branch: #137, `fl1/tides-2yr`

## What's wrong
On an iPhone-width screen (390 px) the date range ("2025-10-15 → …") in the tide
toolbar is cut off, and it gets worse once the Today button appears.

## Proof
Coordinator's screenshot at 390 px (on the coordinator machine).

## Done when
A screenshot at 390 px shows the full range text (or a deliberate shorter format)
with the Today button visible, and nothing overflows the toolbar.
