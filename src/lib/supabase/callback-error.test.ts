import { describe, expect, it } from "vitest";

import { callbackErrorReason } from "./callback-error";

const reason = (query: string) => callbackErrorReason(new URLSearchParams(query));

describe("which message a failed sign-in callback shows", () => {
  it("calls an expired or spent email link a link problem, not a Google cancel", () => {
    expect(reason("error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired")).toBe("link_expired");
  });

  it("treats a bare denial as the angler backing out of Google's screen", () => {
    expect(reason("error=access_denied&error_description=The+user+denied+access")).toBe("cancelled");
  });

  it("does not hide a provider or configuration failure as a cancel", () => {
    expect(reason("error=server_error&error_code=unexpected_failure")).toBe("provider_failed");
    expect(reason("error=invalid_request&error_description=redirect_uri_mismatch")).toBe("provider_failed");
  });
});
