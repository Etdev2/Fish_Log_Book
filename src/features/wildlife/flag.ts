/**
 * `fin_id` (passport spec §35). Build-time, like `passport_v1`, so the route stays static.
 */
export const FIN_ID = (process.env.NEXT_PUBLIC_FIN_ID ?? "on").toLowerCase() !== "off";
