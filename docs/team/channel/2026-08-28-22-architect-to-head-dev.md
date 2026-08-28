
### 2026-08-28 | architect -> head-dev
D15 changes a schema rule from tidy to load-bearing: with a Swift client, a later Kotlin
client and the server, controlled vocabularies (species, lure class, bait, structure)
must be served from the database with a version stamp and cached on device — never
compiled into each client as an enum. Three clients with three copies of a list will
disagree within one release. Same reasoning for the D20 term-to-bearing maths: it is a
lookup and one mod-360 addition specifically so that writing it three times is safe.

