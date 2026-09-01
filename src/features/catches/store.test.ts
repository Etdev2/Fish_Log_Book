import { describe, expect, it } from "vitest";

import { __changedFieldsForTests as changedFields } from "./store";

/**
 * ADR 004 §3: a patch carries changed fields only. These pin the behaviour that lets two
 * devices edit different fields of one catch without either clobbering the other.
 */
describe("changedFields", () => {
  it("sends only what moved", () => {
    expect(changedFields({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual({ b: 3 });
  });

  it("sends nothing when nothing moved", () => {
    expect(changedFields({ a: 1, b: "x" }, { a: 1, b: "x" })).toEqual({});
  });

  it("treats a rebuilt but equal array as unchanged", () => {
    expect(changedFields({ tags: ["night bite"] }, { tags: ["night bite"] })).toEqual({});
  });

  it("catches a real array change", () => {
    expect(changedFields({ tags: ["a"] }, { tags: ["a", "b"] })).toEqual({ tags: ["a", "b"] });
  });

  it("catches an array that shrank", () => {
    expect(changedFields({ tags: ["a", "b"] }, { tags: ["a"] })).toEqual({ tags: ["a"] });
  });

  it("sends a field cleared to null", () => {
    expect(changedFields({ weight_g: 100 }, { weight_g: null })).toEqual({ weight_g: null });
  });

  it("does not confuse null with undefined-but-present", () => {
    expect(changedFields({ notes: null }, { notes: null })).toEqual({});
  });

  it("never sends a field the edit did not touch", () => {
    const before = { species_id: "bluefin_tuna", notes: "meter marks", weight_g: 38102 };
    const after = { species_id: "bluefin_tuna", notes: "meter marks", weight_g: 40000 };
    expect(Object.keys(changedFields(before, after))).toEqual(["weight_g"]);
  });
});
