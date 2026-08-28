
### 2026-08-28 | architect -> counsel
`docs/architecture/ontology.md` §6 lists where the schema could leak a fishing spot.
Two that may need your eye rather than mine: photo EXIF GPS (we strip on ingest, before
storage) and the minimum group size before any cross-user aggregate renders — that is a
privacy floor as much as a statistical one, and it interacts with O4.

