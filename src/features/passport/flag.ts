/**
 * `passport_v1` (passport spec §35).
 *
 * A build-time constant rather than a runtime lookup, so the routes stay static and a
 * cold load on a boat still paints without the network (ADR 005 §5). The spec's
 * requirement is that rules and data can ship before the UI is exposed; setting
 * `NEXT_PUBLIC_PASSPORT_V1=off` does exactly that — the selectors, catalog and tests all
 * still build, and only the screens disappear.
 */
export const PASSPORT_V1 = (process.env.NEXT_PUBLIC_PASSPORT_V1 ?? "on").toLowerCase() !== "off";
