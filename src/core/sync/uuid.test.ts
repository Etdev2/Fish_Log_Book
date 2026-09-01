import { describe, expect, it, beforeEach } from "vitest";

import vectors from "./uuid-vectors.json";
import { __resetUuidv7ClockForTests, isUuidv7, uuidv7, uuidv7TimestampMs } from "./uuid";

const hexOf = (id: string) => id.replace(/-/g, "");

beforeEach(() => {
  __resetUuidv7ClockForTests();
});

describe("uuidv7 encoding vectors", () => {
  for (const vector of vectors.encoding) {
    it(vector.name, () => {
      __resetUuidv7ClockForTests();
      // Drive the sequence to the vector's value by minting into the same millisecond.
      let id = uuidv7(vector.timestampMs);
      for (let i = 0; i < vector.sequence; i += 1) id = uuidv7(vector.timestampMs);

      const hex = hexOf(id);
      expect(hex.slice(0, 12)).toBe(vector.expectedTimestampHex);
      expect(hex[12]).toBe(vector.expectedVersionNibble);
      expect(hex.slice(13, 16)).toBe(vector.expectedSequenceHex);
      // variant: top two bits of byte 8 are 0b10
      expect(Number.parseInt(hex[16], 16) & 0b1100).toBe(0b1000);
    });
  }
});

describe("uuidv7 round trip", () => {
  for (const { timestampMs } of vectors.roundTrip) {
    it(`recovers ${timestampMs}`, () => {
      __resetUuidv7ClockForTests();
      expect(uuidv7TimestampMs(uuidv7(timestampMs))).toBe(timestampMs);
    });
  }
});

describe("uuidv7", () => {
  it("is well formed", () => {
    expect(isUuidv7(uuidv7())).toBe(true);
  });

  it("rejects a v4 uuid", () => {
    expect(isUuidv7("f81d4fae-7dec-41d0-a765-00a0c91e6bf6")).toBe(false);
  });

  it("rejects nonsense", () => {
    expect(isUuidv7("not-a-uuid")).toBe(false);
    expect(uuidv7TimestampMs("not-a-uuid")).toBeNull();
  });

  it("is unique across a burst", () => {
    const ids = new Set(Array.from({ length: 10_000 }, () => uuidv7()));
    expect(ids.size).toBe(10_000);
  });

  it("sorts lexicographically in mint order, including within one millisecond", () => {
    const ids = Array.from({ length: 5_000 }, () => uuidv7(1_756_000_000_000));
    const sorted = [...ids].sort();
    expect(sorted).toEqual(ids);
  });

  it("keeps ordering when the device clock steps backwards", () => {
    const before = uuidv7(1_756_000_000_000);
    const afterClockWentBack = uuidv7(1_755_000_000_000);
    expect(afterClockWentBack > before).toBe(true);
  });

  it("borrows a millisecond forward rather than repeating a sequence", () => {
    // 4097 ids in one millisecond: the 4097th cannot fit the 12-bit counter.
    const ids = Array.from({ length: 4_097 }, () => uuidv7(1_756_000_000_000));
    expect(new Set(ids).size).toBe(4_097);
    expect(uuidv7TimestampMs(ids[4_096])).toBe(1_756_000_000_001);
  });
});
