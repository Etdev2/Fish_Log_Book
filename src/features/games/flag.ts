/**
 * `boat_games_v1`.
 *
 * A build-time constant, not a runtime lookup, so the routes stay static and a cold load
 * on a boat still paints without the network (ADR 005 §5) — the same shape as
 * `features/passport/flag.ts`. Setting `NEXT_PUBLIC_BOAT_GAMES_V1=off` hides the screens
 * while the engine, its tests and the database migration all still ship.
 */
export const BOAT_GAMES_V1 =
  (process.env.NEXT_PUBLIC_BOAT_GAMES_V1 ?? "on").toLowerCase() !== "off";
