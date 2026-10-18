# My map, ocean layers, and catch condition snapshots

Status: draft specification and Wayfinder input. No product code is implemented or authorized by this document. Et owns readiness and builder assignment.

Author: Codex, Reef Calder. Date: 2026-10-18.

## Problem Statement

Et wants to see sea-surface temperature and chlorophyll on a usable ocean map, tap Log Fish to preserve the position of the catch, and later inspect the wind, surface current and water temperature associated with that place and time. Saving a fish must remain reliable offshore. An old satellite image, a distant buoy and a phone GPS fix describe different things and must not appear equally exact or equally live.

## Solution

Add a private My map surface with the angler's catches, a NOAA chart for orientation, and independently controlled SST and chlorophyll overlays. Keep legal boundary vectors above environmental colours. Log Fish uses the existing durable local catch write, records capture time and the best valid device fix without waiting for network, and immediately adds a marker when a fix exists. Background enrichment fills a separate condition snapshot, keyed to the original catch time and position. Opening a marker shows the catch and the provenance of each available condition.

## User Stories

1. As an angler, I want to open My map and recognise the coastline and harbours, so I can orient myself.
2. As an angler, I want to enable an SST layer, so I can inspect surface temperature patterns.
3. As an angler, I want to enable a chlorophyll-a layer, so I can inspect ocean-colour patterns.
4. As an angler, I want independent layer toggles and opacity controls, so I can read the chart beneath them.
5. As an angler, I want each layer's legend, units, effective date, resolution and source visible, so I understand its limits.
6. As an angler, I want cloud gaps and missing coverage shown clearly, so I do not mistake missing data for cold or clear water.
7. As an angler, I want Log Fish to preserve the activation time and device position, so the record represents the bite rather than where I finish a form.
8. As an angler, I want my fish saved before optional work runs, so slow GPS or providers cannot lose it.
9. As an angler, I want an accuracy circle and fix age, so a pin does not imply survey precision.
10. As an angler, I want permission denial or no GPS to save an unlocated catch, so logging always works.
11. As an angler, I want a late fix identified as late, so the app does not pretend I stayed still while drifting.
12. As an angler, I want opening a marker to show wind speed and the direction it came from, so I can compare sessions.
13. As an angler, I want surface current speed and the direction it travels toward, so I can distinguish it from wind and tide movement.
14. As an angler, I want my thermometer reading preserved beside any external temperature reference, so my measurement is never replaced.
15. As an angler, I want each condition to state observation time, retrieval time, source distance and observation kind, so I can judge whether it describes my water.
16. As an angler, I want offline catches enriched at their original times after reconnection, so today's conditions never fill yesterday's catch.
17. As an angler, I want retrying or reconnecting to preserve one catch, one marker and one logical enrichment job, so duplicates do not corrupt my history.
18. As an angler, I want my exact catch coordinates visible only to me and existing explicitly authorised access, so the map does not expose fishing spots.
19. As an angler, I want offline boundaries and existing catches available when the chart is missing, so losing signal does not remove my records.
20. As a screen-reader user, I want an equivalent catch list and condition table, so the feature works without interpreting map colours.
21. As an angler, I want Celsius/Fahrenheit and knots displayed using my preferences, so I do not have to convert units on a boat.
22. As an angler, I want stale, pending and unavailable conditions named plainly, so a blank never means zero.

## Implementation Decisions

These are proposed implementation defaults, subject to the Wayfinder gates below.

- Preserve the existing Leaflet renderer boundary; do not add a second mapping SDK. My map owns personal catch data; Fish Legal owns legal answers. Share rendering contracts rather than merging private catches into public/legal data queries.
- Order layers as chart, SST/chlorophyll, official boundaries, private catches and current device accuracy. Environmental overlays must never obscure legal lines. Enable both environmental layers independently; start with SST visible and chlorophyll off to keep the initial screen readable. Selecting a layer gives its legend priority.
- Each layer descriptor identifies provider, dataset and version, variable, coverage, units, time/composite interval, palette, no-data treatment, attribution, licence and request bounds. Pin an explicit source time per rendered layer; no unrecorded provider `latest` value.
- Use WMS or bounded raster requests through a cache as supported by each verified service. Match projection and axis order explicitly. The selected numeric dataset is the source of values; never infer temperature or chlorophyll by reading image colours. Begin with bounded viewport images/tiles, not global NetCDF downloads on phones.
- Reuse the existing catch store, outbox, condition snapshot and enrichment planning/merge seams. Existing schema/type definitions are starting points, not proof that a live worker already exists. Confirm migration application status before relying on any remote table.
- Log Fish freezes the activation timestamp. Request high-accuracy GPS with no cached fix accepted silently. Warm-up may begin when the form opens, but a fix must be evaluated against the frozen capture time. Proposed freshness target: within five seconds; late or older fixes retain fix timestamp and offset and are labelled approximate. These thresholds require explicit acceptance; no promise of mathematically exact location is possible from a phone.
- Preserve existing five-decimal coordinate storage and measured accuracy. Add fix timestamp/capture offset and location basis only where absent, with a compatible migration and sync parser. Never use a named fishing spot, last session's fix, or a later device position as an unlabelled replacement for catch GPS. Missing position remains null and has no fabricated map marker.
- A manual pin correction, when supported by the existing product contract, preserves the original device fix and marks the correction's basis; it never relabels a manual point as GPS. No new correction editor is required for this first slice.
- Save first. Optional GPS attachment, marker refresh, snapshot creation and provider work cannot block the durable catch. When a late location arrives, enrichment is scheduled against that catch and its original time; superseded requests must not overwrite newer location versions.
- Keep a historical snapshot separate from the current map view. Panning, changing layer time, refreshing a provider or editing a catch must not silently rewrite the old snapshot. Preserve original source version and retrieval time; any revised reconstruction is explicit and versioned.
- Reuse field-specific freshness and distance thresholds as review inputs. Wind's existing maximum age is one hour, current's two hours; satellite layers may span days. Evaluate age relative to the catch time for historical enrichment and relative to now for a current display. Stale values are either refused for a fresh snapshot or shown with their stale state, never silently promoted to live.
- Store SI: degrees Celsius, metres per second, chlorophyll mg/m³ and true-north bearings in [0, 360). Convert only for display. Wind bearing means FROM; current bearing means TOWARD. If current components are eastward u and northward v, derive speed and clockwise bearing with tested quadrants; zero-speed current has no meaningful direction. Tide height derivative is always tide movement, never current speed.
- Keep user-entered water temperature and current term/bearing separate from provider observations. D8/O3 continue to own manual water temperature. An automatic external reference is labelled buoy water temperature or analysed SST, never a measurement at the hook. MUR is an L4 analysis, not an in-situ sensor reading; classify it accordingly rather than flattening all satellite-derived products to observations.
- Retain provider/dataset/version, observation kind, observation/reference time, fetched time, spatial resolution, actual sample/station location or distance, quality flag, source units, processing version and composite bounds. Reject malformed or missing units, invalid bearings, sentinels, NaN, land pixels and failed quality flags at provider boundaries.
- Provider requests/logs see the existing 1 km cell, not exact catch coordinates. Requests for public map imagery use viewport bounds, never private marker payloads. Exact local coordinates must not reach tile URLs, analytics, error logs or another user's map. Switching accounts must clear or partition private local records and pending jobs.
- Use a bounded worker with per-provider deadlines, deduplication, cache and capped retries. Reuse existing lifecycle states: pending, partial, complete, failed/retryable and unavailable/terminal. A successful retry may fill a missing provider value; it never overwrites a user measurement. No-coverage and bad position are distinct from transport failure.
- Offline: preserve catches, list, installed boundary vectors and last saved snapshots. Keep previously cached environmental imagery with its original time and a cached/stale label; otherwise show layer unavailable offline. Network imagery is optional and must not evict the rules package or catch data. Downloadable chart packs are a later ADR, as proposed ADR 013 states.
- Initial validation area is Southern California, including Long Beach, Catalina approaches and Orange County; the model stores no region column on a catch. Out-of-coverage data stays unavailable. No fallback provider may enter silently. Proposed sources require operational coverage proof before selection is final.

## Testing Decisions

Prefer existing high-level seams: a catch written through the store/outbox with delayed location and asynchronous snapshot updates, the enrichment plan/merge functions, and the existing pure geospatial resolver. A good test describes a result an angler can observe and survives refactoring.

- Capture tests: GPS success, denial, timeout, stale cached fix, moving-boat late fix, offline save, restart and duplicate/retry all leave one durable catch. A catch logged at a known instant is never enriched using reconnect time or later device coordinates. No-GPS leaves null, not zero or a spot centroid.
- Provider contract fixtures: validate units, UTC, direction conventions, missing sentinels, land/cloud masks, quality, composite times, provider versions and partial responses. Cover north/east/south/west currents and calm current. Test refusal/retry boundaries and original user readings surviving enrichment.
- Layer tests: explicit time, projection/axis order, transparent no-data, numerical lookup matching the chosen grid cell, attribution/legend, independent toggles and boundary precedence. A cache hit must preserve the same dataset version/time as a miss.
- Security tests: two users cannot see one another's markers or jobs; account change cannot reuse the previous user's local private map. Third-party requests contain only approved cell/viewport parameters. Never put real user GPS in fixtures or screenshots.
- Boundary tests: import round-trip degree/minute conversion, longitude sign, coordinate order, CRS transformation, closed rings/holes and multipart topology. The 50-fm line has independent known-point fixtures on each side, tied to exact legal waypoint indices; exact-edge and uncertainty/simplification cases retain the conservative result. Repeat the same fixture corpus offline.
- Browser proof at 320 and 390 pixels: Log Fish to marker to snapshot; toggle both overlays; open legends and credits; simulated provider failure; reconnect without duplicate markers; offline reload after the required assets are installed. Check keyboard/touch interaction and the equivalent list. Test on a real iPhone for GPS timing, storage retention and installed-app/offline behavior; browser emulation alone is inconclusive for those claims.
- Each implementation PR runs dependency install, repository verify and production build, records every exit code and pins its reviewed base/head. Attach affected-flow proof, not only unit-test totals.

## Out of Scope

Public/community catch heatmaps, fleet tracking, research exports, a bite score, recommendations, native Swift implementation, device/sounder integration, automatic navigation or collision avoidance, new legal determinations from imagery, paid vendor commitments, and production migrations/deployment. Wind/current arrow map layers are later; this slice records their values in catch popups. Missing-ID-photo workstream D belongs to the separate photo effort.

## Further Notes

### ADR relationship and source handoffs

This work **follows proposed ADR 013's architecture; it does not replace it or declare it accepted**. It extends the plan with environmental overlays and private catches. Before any network map layer ships, Et must accept ADR 013, amended to cover environmental layers and the source corrections below. ADR 007 continues to govern offline vectors and conservative legal resolution. D25's earlier prototype cut of live wind/temperature needs a recorded scope amendment for this new phase; D8 manual measurements remain intact.

- [Proposed ADR 013 on Claude's branch](https://github.com/Etdev2/Fish_Log_Book/blob/claude/fish-log-map-id-p28yah/docs/architecture/decisions/013-real-chart-and-official-boundaries.md).
- [Workstream E, real chart and official boundaries, on Claude's branch](https://github.com/Etdev2/Fish_Log_Book/blob/claude/fish-log-map-id-p28yah/docs/team/handoff/2026-10-18-map-id-photos-prompt.md#e-real-chart-and-official-boundaries-network-and-an-accepted-adr-needed).
- The two preceding source documents were inspected at Claude head `acd3adbc6c4fe891ab69bab33f84c18007774f89`; ADR 013 is a proposal, not application code under review.
- Existing [catch environmental enrichment](../specs/expansion/catch-environmental-enrichment.md) and [fisheries intelligence map](../specs/expansion/fisheries-intelligence-map.md) proposals supply prior design. Only the private My map slice is proposed here; the aggregate-map privacy program is not pulled into this scope.

### Every proposed map layer and coordinate source

Reconnaissance date: 2026-10-18. Documentation/metadata access below is evidence of a candidate, not proof of a working application integration. No boundary coordinate has been imported, generated or hand-entered in this branch.

| Layer / value | Source and access | Semantics and remaining proof |
| --- | --- | --- |
| Chart coastline, depths, harbour labels and navigation symbols | [NOAA ENC display-service documentation](https://nauticalcharts.noaa.gov/data/gis-data-and-services.html); [NOAA Chart Display service](https://gis.charttools.noaa.gov/arcgis/rest/services/MCS/NOAAChartDisplay/MapServer/exts/MaritimeChartService/MapServer); WMS child linked from the NOAA documentation | Follows ADR 013; US ENC coverage, weekly published updates. Confirm GetCapabilities, CRS, image export, attribution and terms in the deployment runtime. The service metadata says it is not for navigation: do not claim Navionics equivalence or navigational certification. No foreign chart fallback. |
| SST raster and catch SST reference | NASA JPL MUR v4.1, NOAA ERDDAP dataset `jplMURSST41`, variable `analysed_sst`; [metadata and numeric access](https://upwell.pfeg.noaa.gov/erddap/griddap/jplMURSST41.html); [WMS documentation](https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/index.html) | About 1 km daily L4 foundation-temperature analysis; retain nominal analysis time, analysis error, mask, dataset revision and actual source units. Recent days can be revised. Metadata acknowledges NASA MEaSUREs/JPL; free redistribution terms are linked there. Not minute-by-minute temperature at the boat. |
| Chlorophyll-a raster | NOAA CoastWatch S-NPP VIIRS, dataset `nesdisVHNchlaDaily`, variable `chlor_a`; [metadata and numeric access](https://coastwatch.pfeg.noaa.gov/erddap/griddap/nesdisVHNchlaDaily.html) | Daily approximately 4 km ocean-colour retrieval, mg/m³, log legend, cloud/land no-data. Metadata labels it experimental and links free redistribution terms. The retrieved page ended at 2026-10-16T12:00Z: a daily product is not guaranteed current. Prove actual SoCal coverage and imagery request support before final selection. |
| Personal catch markers and their uncertainty circles | Browser/device geolocation, linked to each locally stored catch; no external coordinate dataset | Origin is the actual device fix with timestamp and accuracy, or an explicitly labelled manual correction. These are private markers; no new sharing permission is granted. |
| Wind speed/direction snapshot | NOAA NDBC standard meteorological observations: WSPD/WDIR; [format](https://www.ndbc.noaa.gov/faq/measdes.shtml); [station 46025 sample](https://www.ndbc.noaa.gov/data/realtime2/46025.txt) | Nearby instrument reference, m/s and degrees FROM true north, not an exact measurement at the catch. Select stations with reported wind, actual sensor height and accepted distance/time/quality. Do not assume every wave buoy has wind. Real-time text access and archived backfill must both be proven; some documentation requests were blocked in reconnaissance. |
| External buoy water-temperature reference | NDBC WTMP from the same standard-met feed; [station 46222 sample](https://www.ndbc.noaa.gov/data/realtime2/46222.txt) and the preceding 46025 sample are examples, not hardwired defaults | Sensor reference at the station's documented depth, with timestamp and distance. Missing WTMP stays absent. Never prefill or overwrite the angler's manual thermometer field. |
| Surface current speed/direction snapshot | NOAA/IOOS HFRNet US West Coast RTV, ERDDAP `ucsdHfrW6`; [metadata and numeric access](https://coastwatch.pfeg.noaa.gov/erddap/griddap/ucsdHfrW6.html); underlying NDBC/HFRNet source is linked in metadata | Hourly approximately 6 km surface velocity estimates for upper-ocean water; derive speed and TOWARD bearing from source u/v. Radar coverage is coastal and patchy. Retrieved metadata ended at 2026-10-11T20:00Z, so it cannot establish fresh coverage on October 18. Demonstrate fresh source samples or ship unavailable, not stale-as-live. No hidden tidal-height substitute. |
| California MPA legal coordinate control points | CDFW `ds3207`, coordinates derived from CCR Title 14 §632; [official CA dataset page](https://publish.data.ca.gov/dataset/marine-protected-areas-coordinates-r7-cdfw-ds3207); [source archive](https://filelib.wildlife.ca.gov/Public/BDB/GIS/BIOS/Public_Datasets/3200_3299/ds3207.zip) | These are coordinate control points, not a ready-made legal polygon. Resolve rings, shoreline segments and applicable legal text from §632; do not join all points blindly. Keep original CRS and IDs; confirm and record transformation to WGS84. |
| California MPA cartographic polygons | CDFW `ds582`; [metadata, disclaimer and CC BY 4.0 terms](https://filelib.wildlife.ca.gov/public/BDB/GIS/BIOS/metadata/DS0582.html); [archive](https://filelib.wildlife.ca.gov/Public/BDB/GIS/BIOS/Public_Datasets/500_599/ds582.zip) | Display-only cartographic representation where that is the source basis. Carry the agency disclaimer wherever drawn. Legal text wins over cartographic disagreement. Check version/effective dates: the retrieved metadata describes January 2019 data, not a guarantee of current regulation. |
| 50-fm RCA waypoint polyline | [50 CFR §660.72(a)](https://www.ecfr.gov/current/title-50/chapter-VI/part-660/subpart-C/section-660.72), published ordered latitude/longitude waypoint table | Corrects ADR 013 / handoff's generic Subpart G reference: these coordinates are in Subpart C. Preserve the legal straight-line connections, original degree/minute strings, order, source effective date and segment indices. Do not trace a chart depth contour or move waypoints to match bathymetry. |
| Recreational groundfish exclusion polygons | [50 CFR §660.70(t)](https://www.ecfr.gov/current/title-50/chapter-VI/part-660/subpart-C/section-660.70); [CDFW Cowcod/GEA definitions and ordered coordinates](https://wildlife.ca.gov/Conservation/Marine/Cowcod) | Corrects ADR 013's recreational CCA framing: eight GEAs replaced recreational/non-trawl CCAs effective January 1, 2024. CCAs remain relevant to trawl rules; do not apply that geometry/rule to recreational anglers. Preserve fishery/platform applicability and effective dates. |
| California recreational groundfish management-area delimiters | CCR Title 14 §§27.25–27.45, linked/quoted by [CDFW's current groundfish summary](https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary) | Source the legally specified latitude/area descriptions. A presentation fill needs documented coastal/offshore bounds; arbitrary rectangular map extents must never become legal area geometry. Imported limits/shoreline pieces each retain their own source. |

For every imported geometry retain raw download bytes and SHA-256, canonical source URL, retrieval time, source update/effective interval, licence and attribution, original CRS, transform version, feature/waypoint IDs, geometry basis, simplification algorithm and measured tolerance. Keep source geometry separate from the display derivative. Verify whether the existing provenance type actually has each field; add a typed import manifest where it does not, rather than stuffing arbitrary keys into RuleProvenance. Start legal polylines at zero simplification; any nonzero tolerance needs topology/ambiguity tests. No coordinate is derived from an AI image, a screenshot, an unofficial map or memory.

### Why a Wayfinder is required

The destination spans capture, offline storage, background acquisition, legal geometry and map display, with unresolved provider freshness and a required architecture decision. It is larger than one safe implementation session. The map's destination is a buildable contract and a verified first vertical slice plan. The draft above makes the product concrete without resolving human decisions on Et's behalf.

Frontier decisions: accept/amend ADR 013 and this narrow scope; prove candidate source/geometry access and fresh SoCal coverage. After those resolve, propose small PRs in order: private GPS markers with no provider dependency; snapshot acquisition with provenance; SST and chlorophyll layers; official boundary imports/chart integration after ADR acceptance. Each PR has one builder and independent review. The COO sequences the actual ticket; this document names no builder and sets no ready label.

### Branch and overlap disclosure

Branch: `codex/map-environment-spec-20261018`, based on `79bdb14622ce94940362c215e2517ee62c4a9efb`.

This branch writes only this new spec, a separate Codex review report/proof files, its own worklog and its own Agent Resources card. It does not edit ADR 013, the handoff prompt, Claude's worklog, Claude's screenshots or any application file. File intersection with Claude's diff is empty. Future product code may touch shared rendering/capture/condition modules; no such write lane is claimed here. Claude's branch remains untouched.

Method: Matt Pocock's [to-spec](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/to-spec/SKILL.md) and [Wayfinder](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/wayfinder/SKILL.md), at the Sweet Potato registry pin. This is a draft: readiness remains with Et despite the generic to-spec ready-label default.
