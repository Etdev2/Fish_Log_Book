#!/usr/bin/env node
/**
 * The layout rules that only a browser can check (docs/specs/expansion/ui-ux-critic-loop.md §11).
 *
 * Every finding in that document's Round 1 was a MEASUREMENT, not an opinion: the primary
 * action on a live tournament sat 740px down a 640px viewport, two navigation systems
 * pointed at the same four places under different names, and the shortest label in the
 * bottom bar was a 45px touch target. None of those is visible to the type checker, to
 * ESLint, or to any test that reads the files as text. All of them are one careless
 * refactor away from coming back.
 *
 * So they are pinned here, against the running application, the same way
 * check-migrations-apply.sh pins the SQL. Reading a component does not tell you where it
 * renders.
 *
 * Usage:
 *   npm run build && npm run layout                                # the CI path
 *   BASE_URL=http://localhost:3000 npm run layout                  # reuse `next dev`
 *
 * It serves the PRODUCTION build, not `next dev`. Turbopack compiles each route on first
 * request, so a dev run spends most of a minute per cold route and measures a page that
 * is still settling; `next start` serves what a user would actually get, instantly. CI
 * already runs `npm run build` before this step.
 *
 * Exits 2 — never 0 — when Chromium or the build is missing. A skip that looks like a
 * pass is exactly the failure this script exists to prevent.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("playwright is not installed. `npm ci` should have provided it.");
  process.exit(2);
}

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3111";
const OWN_SERVER = process.env.BASE_URL === undefined;

/** The demo store seeds this one, and it is the only live tournament in it. */
const LIVE_TOURNAMENT = "demo-harbor-shootout";

/**
 * 320 is the narrowest screen the design system commits to (docs/design). 390 is the
 * phone most people actually hold. Both, every time: the bottom bar changes layout
 * between them, so a rule that holds at one can break at the other.
 */
const WIDTHS = [320, 390];

/**
 * A 640px viewport is deliberately generous — a real iPhone SE has ~568px of usable
 * height. If something fails to clear the fold at 640 it is far below it in a hand.
 */
const VIEWPORT_HEIGHT = 640;

const ROUTES = [
  "/",
  "/log",
  "/setup",
  "/tournaments",
  `/tournaments/${LIVE_TOURNAMENT}/overview`,
  `/tournaments/${LIVE_TOURNAMENT}/rules`,
  `/tournaments/${LIVE_TOURNAMENT}/leaderboard`,
  `/tournaments/${LIVE_TOURNAMENT}/register`,
];

const TOURNAMENT_SECTIONS = ["overview", "rules", "register", "catches", "leaderboard"];

const failures = [];
const fail = (route, width, message) => failures.push(`${route} @${width}px — ${message}`);

/**
 * The one touch-target exception the design system grants, and it is granted by name.
 *
 * docs/design/03-touch-and-interaction.md §1 allows calendar day cells at 320px to sit
 * under the floor, once, because the cost of a miss there is a wrong day opening and one
 * extra tap to back out — nothing written, nothing lost — and the agenda view always
 * offers a full-size row into the same data.
 *
 * Two honest notes. The design doc says "~45px"; measured here they are 38px wide, which
 * is further under the floor than the exception was written against and worth `ux-ui`
 * knowing. And the exception is scoped to the calendar grid on "/" — anywhere else, the
 * same shape of control fails, which is exactly what §1 says should happen.
 */
const TOUCH_EXCEPTIONS = [
  { route: "/", width: 320, match: /^BUTTON "\d{1,2}"/, reason: "calendar day cells (design 03 §1)" },
];

const exempt = (route, width, target) =>
  TOUCH_EXCEPTIONS.some((e) => e.route === route && e.width === width && e.match.test(target));

/**
 * The bottom bar wraps to two rows below 384px, on purpose.
 *
 * shell-nav.tsx records the measurement and the reasoning: six labels want 366px in one
 * row, equal columns would want 432px, and shrinking the type is not available because
 * the 16px floor in docs/design/01-foundations.md has no escape hatch. Two rows of three
 * at full size is the least-bad option, and the six destinations are a founder decision.
 *
 * It is still 97px of a 640px screen, and ui-ux-critic-loop.md R5-D leaves the
 * composition of that bar open. This allowance is the honest shape of that: the height is
 * asserted so it cannot grow further, and the number is here to be argued down rather
 * than rediscovered.
 */
const MAX_NAV_HEIGHT = { 320: 100, 390: 56 };

async function measure(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(400);

  return page.evaluate(
    ({ sections }) => {
      const overflow = {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      };

      const small = [];
      for (const el of document.querySelectorAll("a,button,input,select,[role=button]")) {
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;

        /*
          A control wrapped in a label is not the target — the label is.

          A 20px checkbox inside a full-width <label class="p-space-4"> is tappable
          across the whole card, which is both the intent and what a finger actually
          hits. Measuring the <input> there would report a defect that does not exist,
          and a check that cries wolf gets deleted. The label has to clear the floor on
          its own for this to apply.
        */
        const label = el.closest("label");
        const target = label ? label.getBoundingClientRect() : box;

        // Rounded: a sub-pixel layout can land on 47.98 and that is not a defect.
        if (Math.round(target.width) < 48 || Math.round(target.height) < 48) {
          small.push(`${el.tagName} "${(el.textContent ?? "").trim().slice(0, 24)}" ${Math.round(target.width)}x${Math.round(target.height)}`);
        }
      }

      /*
        Anchors into this tournament's own sections, paired with the words on them.

        The label matters, not just the destination. A tab reading "Standings" and a card
        reading "See all standings" are one navigation system with a call to action in it;
        two controls both reading "Event", three inches apart, are the duplication this
        rule exists to catch.
      */
      const sectionLinks = [];
      for (const a of document.querySelectorAll("a[href]")) {
        const match = /\/tournaments\/[^/]+\/([a-z-]+)$/.exec(a.getAttribute("href") ?? "");
        if (match && sections.includes(match[1])) {
          sectionLinks.push({
            section: match[1],
            label: (a.textContent ?? "").trim().toLowerCase().replace(/\s+/g, " "),
          });
        }
      }

      const dock = [...document.querySelectorAll("*")].find((el) => {
        const cs = getComputedStyle(el);
        return (cs.position === "sticky" || cs.position === "fixed") &&
          el.getBoundingClientRect().height > 10 &&
          el.querySelector('nav[aria-label="Primary"]') !== null;
      });

      const primary = document.querySelector('a[class*="min-h-touch-primary"], button[class*="min-h-touch-primary"]');

      return {
        overflow,
        small,
        sectionLinks,
        navHeight: dock ? Math.round(dock.getBoundingClientRect().height) : null,
        primaryTop: primary ? Math.round(primary.getBoundingClientRect().top) : null,
        primaryBottom: primary ? Math.round(primary.getBoundingClientRect().bottom) : null,
        stepText: (document.body.textContent ?? "").match(/Step \d+ of \d+/g) ?? [],
      };
    },
    { sections: TOURNAMENT_SECTIONS },
  );
}

function assertRoute(route, width, m, dockHeight) {
  /* 1. Nothing scrolls sideways. The cheapest signal that a layout has broken. */
  if (m.overflow.scrollWidth > m.overflow.clientWidth) {
    fail(route, width, `horizontal overflow: ${m.overflow.scrollWidth} > ${m.overflow.clientWidth}`);
  }

  /* 2. The 48px floor is absolute (docs/design/06-accessibility-baseline.md §3). */
  for (const target of m.small) {
    if (exempt(route, width, target)) continue;
    fail(route, width, `touch target under 48px: ${target}`);
  }

  /* 3. The bar may not grow. See MAX_NAV_HEIGHT. */
  if (m.navHeight !== null && m.navHeight > dockHeight) {
    fail(route, width, `bottom dock is ${m.navHeight}px, over the ${dockHeight}px allowance`);
  }

  if (!route.startsWith("/tournaments/")) return;

  /*
    4. One navigation system, not two.

    The overview used to render a tab bar AND a stack of numbered journey cards pointing
    at the same five screens under different names. A duplicated href is the signature of
    that mistake growing back, and it is checkable without knowing what the second system
    would be called.
  */
  const seen = new Map();
  for (const link of m.sectionLinks) {
    const key = `${link.section}|${link.label}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [key, count] of seen) {
    if (count > 1) {
      const [section, label] = key.split("|");
      fail(route, width, `${count} controls labelled "${label}" both go to "${section}" — one navigation system, not two`);
    }
  }

  /*
    5. No step counters in tournament navigation.

    Three of them disagreed at once: numbered tab chips, four numbered journey cards, and
    a "Step 3 of 3" heading on the leaderboard. A tournament is not a wizard — an angler
    moves between these screens all day in whatever order the day takes.
  */
  for (const step of m.stepText) fail(route, width, `step counter in tournament navigation: "${step}"`);

  /*
    6. On the live event, the primary action clears the fold.

    Measured at 740px before this rule existed, on the screen an angler opens with a fish
    flapping in the boat. The threshold is the viewport minus the dock, so the whole
    button is reachable without a scroll.
  */
  if (route.endsWith("/overview") && m.primaryBottom !== null) {
    const fold = VIEWPORT_HEIGHT - (m.navHeight ?? 0);
    if (m.primaryBottom > fold) {
      fail(route, width, `primary action ends at ${m.primaryBottom}px, past the ${fold}px fold`);
    }
  }
}

let server;
if (OWN_SERVER) {
  if (!existsSync(".next/BUILD_ID")) {
    console.error("No production build found. Run `npm run build` first, or point BASE_URL at a running server.");
    process.exit(2);
  }

  server = spawn("npx", ["next", "start", "--port", "3111"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, DEV_AUTH_BYPASS: "true" },
  });
  const ready = new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => reject(new Error("next start did not come up in 60s")), 60_000);
    server.stdout.on("data", (chunk) => {
      if (/Ready in|started server|Local:/i.test(String(chunk))) {
        globalThis.clearTimeout(timer);
        resolve();
      }
    });
    server.on("exit", (code) => reject(new Error(`next start exited with ${code}`)));
  });
  await ready;
  await sleep(500);
}

const browser = await chromium.launch();
try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: VIEWPORT_HEIGHT },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    for (const route of ROUTES) {
      const m = await measure(page, route);
      assertRoute(route, width, m, MAX_NAV_HEIGHT[width]);
    }
    await context.close();
  }
} finally {
  await browser.close();
  if (server) server.kill("SIGTERM");
}

if (failures.length > 0) {
  console.error(`\nlayout: ${failures.length} problem(s)\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error("");
  process.exit(1);
}
console.log(`layout: clean across ${ROUTES.length} routes at ${WIDTHS.join("px, ")}px.`);
