import { describe, expect, it } from "vitest";

import { classifyHttp } from "./http-outcome";

describe("classifyHttp", () => {
  it("2xx is ok", () => {
    expect(classifyHttp(201, "insert").kind).toBe("ok");
    expect(classifyHttp(204, "delete").kind).toBe("ok");
  });

  it("insert 409 / 23505 is duplicate success", () => {
    expect(classifyHttp(409, "insert").kind).toBe("duplicate");
    expect(classifyHttp(400, "insert", { code: "23505" }).kind).toBe("duplicate");
  });

  it("patch 409 is rejected, not duplicate", () => {
    expect(classifyHttp(409, "patch").kind).toBe("rejected");
  });

  it("401/403 stay queued via auth_expired", () => {
    expect(classifyHttp(401, "insert").kind).toBe("auth_expired");
    expect(classifyHttp(403, "patch").kind).toBe("auth_expired");
  });

  it("network-ish statuses stay queued", () => {
    expect(classifyHttp(0, "insert").kind).toBe("unreachable");
    expect(classifyHttp(503, "insert").kind).toBe("unreachable");
  });
});
