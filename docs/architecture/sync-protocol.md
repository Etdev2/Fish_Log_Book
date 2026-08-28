# Sync protocol (normative)

**Status:** v1. **Owner:** `architect`. **Reasoning:** `decisions/004-offline-store-and-sync.md`.

This document is the contract. The TypeScript in `src/core/sync/` is one conformant
implementation of it, not the definition. The Swift client (D15) is built against this
page and against the vectors in `src/core/rules/vectors/`.

If this document and any client disagree, the client is wrong.

---

## 1. Identity

Every row's primary key is a **UUIDv7 minted on the device** at the moment of the action.
Never a server sequence. Never a round trip.

The id doubles as the idempotency key: a retried insert collides on the primary key and
the collision is **success**, not an error.

## 2. Clocks

| column | written by | used for |
|---|---|---|
| `client_created_at` | device | D24 capture-mode window; display |
| `client_updated_at` | device | the last-writer-wins comparator |
| `created_at` | server (`default now()`) | audit |
| `updated_at` | server (trigger) | **the pull cursor** |

A client never writes `updated_at`. Conflating the two breaks the cursor the first time a
phone's clock is wrong.

## 3. Mutation envelope

```
{ id                 uuidv7      the mutation's own id
  entity             string      table name
  entity_id          uuidv7      the row it acts on
  op                 'insert' | 'patch' | 'delete'
  payload            object      insert: the full row. patch: CHANGED FIELDS ONLY.
  client_updated_at  ISO8601
  device_id          string
  attempts           int
  last_error         string | null
  state              'queued' | 'sending' | 'done' | 'conflicted' | 'rejected' }
```

Patches carry changed fields only. That is what lets two devices edit different fields of
one row without a CRDT and without per-field timestamps.

## 4. Push

Sequential, in outbox insertion order, one row at a time, over PostgREST.

Sequential order is the entire dependency mechanism: a trip is inserted before its
catches because it was queued before them. No topological sort, no batching RPC.

| result | action |
|---|---|
| success | mark `done` |
| primary-key collision on insert | mark `done` — it already landed |
| network error / 5xx | leave `queued`, back off, retry |
| 401 / expired token | refresh the session, then retry. **Never drop the mutation.** If the refresh fails because there is no network, it stays `queued`. |
| 4xx validation error | mark `rejected` and surface it to the angler. Never silent. |

Backoff: exponential with jitter, capped at 5 minutes. Flush is triggered on the `online`
event, on visibility change, on app foreground, and on every new write.

A future `sync_push` RPC applying an ordered array in one transaction is the sanctioned
optimisation for the Watch on cellular. It is not part of v1 and no client may require it.

## 5. Pull

```
select * from <table>
 where updated_at > (cursor - 2 seconds)
 order by updated_at, id
 limit n
```

Tombstones (`deleted_at is not null`) are included. The cursor advances to the highest
`updated_at` received and is stored locally.

**The two-second overlap is mandatory.** Rows committed in one transaction share a
timestamp and a strict `>` cursor steps over some of them. Re-fetching a few rows is free;
a permanently skipped catch is not. The local upsert must therefore be idempotent.

## 6. Conflict resolution

- **insert** — upsert by primary key. Collisions are success. Inserts never conflict.
- **delete** — soft (`deleted_at`). A delete always wins against a concurrent patch.
- **patch** — last-writer-wins per row, compared on `client_updated_at`, not on arrival
  time. Comparing arrival means the device that reconnects last wins even if it edited
  first, which is backwards.
- **a losing patch is written to `public.sync_conflict`**, never discarded.
- **journal body conflicts are surfaced**, not archived quietly: the day page shows both
  versions and a chooser. Everything else is archived silently.

## 7. State vocabulary at the glass

| state | word the angler sees | treatment |
|---|---|---|
| in the outbox | **Saved** | nothing, or a small dot |
| on the server | **Backed up** | nothing |
| conflicted / rejected | needs you | the only state that may interrupt |

Rules:

- A mark is **saved** the instant it is in the local store. No spinner, no disabled button.
- Offline is a normal state, not an error. A quiet "3 waiting to back up" is the whole
  indicator. No red banner.
- Never the word "failed" while retries remain.
- Nothing in the UI blocks on the network. Enrichment arrives later and fills in;
  `enrichment_status = 'pending'` is the normal path, not an edge case.

## 8. Platform notes

- **Web:** IndexedDB via `idb`. iOS Safari has no Background Sync, so the outbox flushes
  only while a tab is open. Accepted for the prototype; one more reason for D15.
- **Swift:** SQLite or CoreData behind the same store interface. The Watch queues into the
  phone's outbox over WatchConnectivity rather than owning a server session.
- **`experimental.useOffline` (Next 16) is not a write queue.** Its pending request lives
  in the tab and dies with it. Use it for navigation and reads only.
