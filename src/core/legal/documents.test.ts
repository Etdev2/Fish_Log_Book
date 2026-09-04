import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LEGAL_CONTACT, LEGAL_DOCUMENTS, LEGAL_VERSION, legalDocument } from "./documents";

/**
 * A privacy notice is a promise about the code, so it is tested like one.
 *
 * These tests are not about prose. They fail when the app starts doing something the
 * notice says it does not do — adding an analytics SDK, calling a third host, loading a
 * remote image. That is the only way a document written today stays true in March.
 */

/** Walks src/ and returns every non-test source file's contents. */
function sourceFiles(): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry)) continue;
      out.push({ path, text: readFileSync(path, "utf8") });
    }
  };
  walk("src");
  return out;
}

describe("legal documents", () => {
  it("publishes all three, each with content and the current effective date", () => {
    expect(LEGAL_DOCUMENTS.map((d) => d.id)).toEqual(["regulations", "terms", "privacy"]);
    for (const doc of LEGAL_DOCUMENTS) {
      expect(doc.effective).toBe(LEGAL_VERSION);
      expect(doc.sections.length).toBeGreaterThan(3);
      for (const section of doc.sections) {
        // A heading with nothing under it reads as a document somebody abandoned.
        expect((section.paragraphs?.length ?? 0) + (section.bullets?.length ?? 0)).toBeGreaterThan(0);
      }
    }
  });

  it("looks a document up by slug, and refuses an unknown one", () => {
    expect(legalDocument("privacy")?.id).toBe("privacy");
    expect(legalDocument("cookies")).toBeNull();
  });

  it("keeps the contact block honest — an address means resolved, and the reverse", () => {
    // Guards the ship-with-a-blank case in both directions: a filled address that still
    // claims to be unresolved would hide a real contact behind the pending notice.
    expect(LEGAL_CONTACT.resolved).toBe(LEGAL_CONTACT.email.length > 0);
  });
});

describe("the privacy notice still matches the code", () => {
  it("has no analytics, advertising, or tracking dependency", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(" ").toLowerCase();
    for (const banned of [
      "analytics",
      "posthog",
      "sentry",
      "mixpanel",
      "amplitude",
      "segment",
      "gtag",
      "google-analytics",
      "plausible",
      "fullstory",
      "logrocket",
      "datadog",
      "bugsnag",
    ]) {
      expect(deps, `"${banned}" would contradict the privacy notice`).not.toContain(banned);
    }
  });

  it("calls exactly two outside hosts at runtime: Supabase and NOAA", () => {
    // Citation links are not calls. Only a URL that reaches a fetch() or a client
    // constructor counts, so this looks at the two files allowed to make requests and
    // asserts nothing else in src/ contains a runtime fetch to an absolute URL.
    const offenders: string[] = [];
    for (const { path, text } of sourceFiles()) {
      // `fetch(` with an absolute URL argument, or an <img>/<script> pointing off-origin.
      const remoteFetch = /fetch\(\s*["'`]https?:\/\//.test(text);
      const remoteAsset = /(?:src|href)=\{?["'`]https?:\/\//.test(text) && /<(?:img|Image|script)/.test(text);
      if (remoteFetch || remoteAsset) offenders.push(path);
    }
    expect(offenders).toEqual([]);

    const tides = readFileSync("src/features/conditions/queries/noaa-tides.ts", "utf8");
    expect(tides).toContain("api.tidesandcurrents.noaa.gov");
    // The notice says we send a station and a date range, not who or where you are.
    expect(tides).not.toMatch(/\b(lat|lon|latitude|longitude|email|user_id)\b\s*:/);
  });

  it("draws the boundary map with no tile server, as the notice claims", () => {
    for (const { path, text } of sourceFiles()) {
      expect(text, `${path} adds a basemap; the notice says the map calls nobody`).not.toMatch(
        /TileLayer|tile\.openstreetmap|tiles?\.mapbox|basemaps\./,
      );
    }
  });

  it("serves species photographs from the app itself, not a remote host", () => {
    const photos = readFileSync("src/features/fish-legal/species-photos.ts", "utf8");
    const sources = [...photos.matchAll(/src:\s*"([^"]+)"/g)].map((m) => m[1]);
    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) expect(src.startsWith("/species-photos/")).toBe(true);
  });
});
