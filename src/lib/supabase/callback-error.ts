/**
 * Which sign-in message a failed /callback should show.
 *
 * Supabase redirects a failure with `error`, `error_code` and `error_description`
 * (https://supabase.com/docs/guides/auth/redirect-urls). A spent or expired email link
 * arrives as `access_denied` too, with an `otp_*` code, so the code is read before the
 * error: telling a magic-link user that "Google sign-in didn't finish" sends them the wrong
 * way. Only a bare denial is treated as the angler backing out of Google's screen; anything
 * else is a failure they did not choose, and is not hidden as a cancel.
 */
export type CallbackErrorReason = "link_expired" | "cancelled" | "provider_failed";

export function callbackErrorReason(params: URLSearchParams): CallbackErrorReason {
  const code = params.get("error_code") ?? "";
  if (code.startsWith("otp_")) return "link_expired";
  if (params.get("error") === "access_denied") return "cancelled";
  return "provider_failed";
}
