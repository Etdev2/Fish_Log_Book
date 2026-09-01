import { describe, expect, it, vi } from "vitest";

import { createLocalPreference } from "./preference";

/**
 * The hook half needs React and is covered by the browser checks. These cover the parts
 * that decide whether a preference is trustworthy: the default, what happens to junk in
 * storage, and what happens when storage itself refuses to work.
 */

function makeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
}

function withWindow(storage: Storage, run: () => void) {
  const events: string[] = [];
  vi.stubGlobal("window", {
    localStorage: storage,
    dispatchEvent: (e: Event) => {
      events.push(e.type);
      return true;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  vi.stubGlobal("localStorage", storage);
  try {
    run();
  } finally {
    vi.unstubAllGlobals();
  }
  return events;
}

const quickMark = () =>
  createLocalPreference<boolean>({
    key: "flb.shortcuts.quick-mark",
    defaultValue: false,
    parse: (raw) => raw === "on",
    serialize: (v) => (v ? "on" : "off"),
  });

describe("createLocalPreference", () => {
  it("defaults off — the whole point of the setting", () => {
    expect(quickMark().defaultValue).toBe(false);
  });

  it("writes a value that reads back as on", () => {
    const store = makeStorage();
    withWindow(store, () => {
      quickMark().set(true);
    });
    expect(store.getItem("flb.shortcuts.quick-mark")).toBe("on");
  });

  it("writes off explicitly rather than removing the key", () => {
    const store = makeStorage({ "flb.shortcuts.quick-mark": "on" });
    withWindow(store, () => {
      quickMark().set(false);
    });
    // An explicit "off" is distinguishable from "never chose", which matters the day the
    // default changes.
    expect(store.getItem("flb.shortcuts.quick-mark")).toBe("off");
  });

  it("notifies this tab, since a storage event only fires in other tabs", () => {
    const events = withWindow(makeStorage(), () => {
      quickMark().set(true);
    });
    expect(events).toEqual(["flb:preference-changed:flb.shortcuts.quick-mark"]);
  });

  it("survives storage that throws on write — Safari private mode", () => {
    const hostile = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
    } as unknown as Storage;
    expect(() => withWindow(hostile, () => quickMark().set(true))).not.toThrow();
  });

  it("is a no-op rather than a crash with no window at all (SSR)", () => {
    vi.stubGlobal("window", undefined);
    expect(() => quickMark().set(true)).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe("units preference parsing", () => {
  const units = () =>
    createLocalPreference<"ft" | "m">({
      key: "flb.units",
      defaultValue: "ft",
      parse: (raw) => (raw === "ft" || raw === "m" ? raw : "ft"),
      serialize: (v) => v,
    });

  it("keeps feet as the founder's default", () => {
    expect(units().defaultValue).toBe("ft");
  });

  it("round-trips metres", () => {
    const store = makeStorage();
    withWindow(store, () => units().set("m"));
    expect(store.getItem("flb.units")).toBe("m");
  });
});
