import { describe, expect, it } from "vitest";

import { encodeTransfer, isAddress, minorToAtomic } from "./erc20";

/**
 * These tests are the reason the hand-rolled encoder is defensible. A wrong byte here is
 * money sent to the wrong place, on a chain, with no undo — so the encoding is pinned
 * against known-good values rather than against itself.
 */

const VITALIK = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

describe("encodeTransfer", () => {
  it("encodes selector, padded address and padded amount, in that order", () => {
    const data = encodeTransfer(VITALIK, BigInt(250_000_000));
    expect(data.slice(0, 10)).toBe("0xa9059cbb");
    expect(data.slice(10, 74)).toBe("000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045");
    // 250000000 = 0xEE6B280
    expect(data.slice(74)).toBe("000000000000000000000000000000000000000000000000000000000ee6b280");
    expect(data).toHaveLength(2 + 8 + 64 + 64);
  });

  it("handles an amount far beyond a JavaScript safe integer", () => {
    // 1000 tokens at 18 decimals. This is exactly where a Number-based encoder goes wrong.
    const data = encodeTransfer(VITALIK, BigInt(1000) * BigInt(10) ** BigInt(18));
    expect(data.slice(74)).toBe("00000000000000000000000000000000000000000000003635c9adc5dea00000");
  });

  it("refuses anything that is not an address, rather than padding it into one", () => {
    expect(() => encodeTransfer("0x1234", BigInt(1))).toThrow();
    expect(() => encodeTransfer(VITALIK.slice(2), BigInt(1))).toThrow();
    expect(() => encodeTransfer(`${VITALIK}00`, BigInt(1))).toThrow();
  });

  it("refuses a zero or negative transfer", () => {
    expect(() => encodeTransfer(VITALIK, BigInt(0))).toThrow();
    expect(() => encodeTransfer(VITALIK, BigInt(-1))).toThrow();
  });
});

describe("isAddress", () => {
  it("accepts either case and rejects the wrong length", () => {
    expect(isAddress(VITALIK)).toBe(true);
    expect(isAddress(VITALIK.toLowerCase())).toBe(true);
    expect(isAddress("0x")).toBe(false);
    expect(isAddress("not an address")).toBe(false);
  });
});

describe("minorToAtomic", () => {
  it("scales cents to a six-decimal stablecoin", () => {
    expect(minorToAtomic(25_000, 6)).toBe(BigInt(250_000_000)); // $250.00 → 250000000
    expect(minorToAtomic(25_000, 6)).toBe(BigInt(250_000_000));
  });

  it("scales cents to an eighteen-decimal token without losing precision", () => {
    expect(minorToAtomic(40_000, 18)).toBe(BigInt(400) * BigInt(10) ** BigInt(18));
  });

  it("keeps zero at zero", () => {
    expect(minorToAtomic(0, 6)).toBe(BigInt(0));
  });

  it("refuses a fractional or negative minor amount", () => {
    expect(() => minorToAtomic(1.5, 6)).toThrow();
    expect(() => minorToAtomic(-100, 6)).toThrow();
  });

  it("refuses implausible decimals rather than producing a nonsense amount", () => {
    expect(() => minorToAtomic(25_000, 0)).toThrow();
    expect(() => minorToAtomic(25_000, 99)).toThrow();
  });
});
