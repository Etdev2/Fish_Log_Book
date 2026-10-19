# Prompt: real chart, photo-first Fish ID, and a page that stays put

Written 2026-10-18 from Et's phone review of the deployed app (screenshots of Legal → map,
Fish ID → bass and salmon, Home, and the rockfish ID). Any agent, Claude or Codex, can run
this prompt. A session that runs it records what it finished and what it left in its
worklog. It does not edit this file.

---

## Role

You are the builder for Fish Log Book, a Next.js 16 app that anglers use on an iPhone,
on a boat, often with no signal. Read `docs/team/HOUSE-RULES.md` before you change
anything. Read the guide under `node_modules/next/dist/docs/` before you write App Router
code.

## What Et asked for, in Et's words, reduced to requirements

1. **"A real map with real boundaries … like Navionics, maps people can rely on."**
   The Legal map is an ocean-blue panel with hand-simplified dashed lines. It must become
   a real chart: coastline, depth, and the official boundary geometry.
2. **"Easy enough so a five-year-old can figure it out."** On today's ID screens the
   results show four equal percentages ("17% / 17% / 17% / 17%") before anyone has
   answered a question, and the text-only answers do not show what a spike or a patch
   looks like.
3. **"Real images of the fish … verified that it's the fish."** Every place the app
   names a fish, salmon and rockfish first, must show a picture of that species. Whales
   and dolphins in Fin ID get the same treatment. A schematic colour block is not a
   picture.
4. **"A complete catalog with images of the rockfish."** One page listing every
   rockfish, each with its picture.
5. **"Make sure I can't lift up certain pages when scrolling."** On iPhone the page
   rubber-bands. The Home screenshot shows the bottom tab bar floating mid-screen with an
   empty band under it.
6. **"It's going to have to work native as well."** It must install to the iPhone home
   screen and behave like an app there. The Swift client (ADR 003) is a later step, not
   this one.
7. **"I don't want to get anybody any tickets."** Read every rule below in that light.

## Hard rules

- **A wrong picture is worse than no picture.** Show a photo only when its species has
  been checked against the agency or museum page it came from. When there is no verified
  photo, say so plainly ("Photo coming — compare with the CDFW guide") and never borrow a
  look-alike.
- **No invented boundaries.** Boundary coordinates come from the official source (CDFW
  MPA datasets ds3207/ds582, 50 CFR §660.72(a) (Subpart C) waypoints for the 50-fm RCA
  line, and 50 CFR §660.70(t) for the current recreational closed areas; Codex read
  CDFW's Cowcod page on 2026-10-18 as saying these replaced the recreational Cowcod
  Conservation Areas from 2024, so confirm against the live sources) with source, retrieval date and simplification tolerance recorded
  in `RuleProvenance` (ADR 007 §3). If you cannot download a source, leave the existing
  labelled-simplified geometry in place and report the blocked host.
- **ADR 007 forbids a map tile layer without a superseding ADR.** Write that ADR first.
  Et accepts it before any tile layer ships. The ADR keeps the offline guarantee: the
  boundary vectors and the legal answer must still work with no network, and the basemap
  is a layer on top that can be absent.
- **AI-generated images are allowed only if a person verifies them.** Et allowed "an AI
  generated replica of the fish that matches perfectly". The app cannot prove a match by
  itself, so a generated image ships only after a named person checks it against an
  agency reference. The image is labelled as an illustration and the reviewer's name goes
  in its credit.
- **No percentages on the ID screens.** ADR 007 §4 already says bands, not percentages.
  Use plain words: "Best match", "Could be", "Less likely".
- **Licences.** Every photo records credit, licence and source URL in
  `src/features/fish-legal/species-photos.ts`. Prefer public domain (NOAA Fisheries,
  USFWS) and Wikimedia Commons CC-BY/CC-BY-SA, then CDFW with attribution. Stock-photo
  thumbnails do not ship.
- Do not weaken a type, lint rule or test to make a change pass.

## Workstreams, in order

Each one can be merged separately. Do them in this order; stop and report if one is
blocked.

### A. The page stays put (no network needed)

- `overscroll-behavior: none` on `html` and `body` so iOS Safari stops rubber-banding.
- The bottom dock sits on the bottom edge and pads for the home indicator
  (`env(safe-area-inset-bottom)`, with `viewport-fit=cover`).
- A web app manifest and Apple web-app metadata so "Add to Home Screen" opens full-screen
  with the app's colours.
- **Done when** the built app serves the manifest, the computed styles show the
  overscroll and safe-area rules, and a phone-sized screenshot shows the dock on the
  bottom edge.

### B. Photo-first ID (no network needed for bundled photos)

- Every candidate in Fish ID (`pack-wizard.tsx`) and the rockfish ID
  (`rockfish-wizard.tsx`) shows its bundled photo, large enough to compare against the
  fish in your hand, with its credit.
- Before any answer: no ranking. Show the pictures and the words "Tap what you see, or
  find the picture that looks like your fish."
- After answers: plain-word bands, never a percentage.
- Species with no verified photo show the honest placeholder.
- Look at every bundled photo used by an ID screen before wiring it, and confirm the
  picture matches the species named in its source URL. Record the check in the worklog.
- **Done when** unit tests cover the band words and the photo-or-placeholder choice, and
  phone-sized screenshots of the salmon, bass and rockfish screens show real pictures.

### C. Rockfish catalog (bundled photos now, the rest when the network allows)

- A catalog page reachable from the rockfish ID and Fish Legal, listing every rockfish
  species the app knows about, alphabetically, each with its photo or the placeholder,
  its scientific name, and a link to its rules card where verified rules exist.
- **Done when** the page renders every rockfish in `SPECIES_PHOTOS` plus the rockfish ID
  profiles, and a test fails if a rockfish profile is missing from the catalog.

### D. Missing photos (network needed)

- Source and verify photos for pink, sockeye and chum salmon, steelhead, the rockfish
  without one, and every whale, dolphin and porpoise in `fin-id-pack.ts`.
- Replace the `source-restricted` (stock) entries in `species-photos.ts`.
- **Done when** no ID or catalog screen shows a placeholder for a species Et listed, and
  no entry carries the `source-restricted` licence.

### E. Real chart and official boundaries (network and an accepted ADR needed)

- Superseding ADR (next number in `docs/architecture/decisions/`) covering basemap source
  (NOAA's ENC-derived chart display is the best public option; NOAA marks it "not for
  navigation", so the app must not claim to equal Navionics or a certified chart), licensing,
  offline behaviour, attribution, and how the basemap is kept from contradicting the
  boundary geometry.
- Replace the simplified boundary geometry with official geometry, simplified with a
  recorded tolerance, and render the CDFW cartographic disclaimer wherever ds582 geometry
  is drawn.
- **Done when** Et has accepted the ADR, the map shows the chart online and the boundaries
  offline, and a geospatial test checks a known point on each side of the real 50-fm line.

## Verification for every workstream

`npm run verify` and `npm run build` exit 0. Look at the screens at phone width
(390 × 844) in a browser and attach the screenshots, or say plainly that you could not.
Green unit tests alone do not prove a change Et can see.

## Report

End with: what shipped and its proof, what is blocked and on what (name hosts and
decisions), and what Et needs to decide. Keep it short enough to read on a phone.
