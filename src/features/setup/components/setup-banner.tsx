"use client";

import Link from "next/link";

import { CARD_CLASS, PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/features/catches/ui-classes";

import { ONBOARDING_PATH } from "../return-to-setup";
import { useSetupProgress } from "../use-setup-progress";

/**
 * The calendar's one line about setup — a pointer to `/onboarding`, not the guide itself.
 *
 * The six-step list used to render here in full, which meant the first thing a new angler
 * met on the home screen was a wall of homework, and the first thing a set-up angler met
 * was a collapsed remnant of it. Founder call, 2026-09-06: the guide moves to its own
 * page and the calendar keeps only an invitation.
 *
 * Three states, and the third is the point:
 *
 * - **Nothing done yet** — a proper welcome. This is somebody's first launch; a slim
 *   progress strip would be too quiet to be the thing they act on.
 * - **Partly done** — one line and a Continue button. Enough to be findable, small enough
 *   that the month grid stays the page.
 * - **Finished** — nothing at all. The calendar goes back to being the calendar. The
 *   guide is still there in the Menu and in Settings for anyone who wants another pass,
 *   which is what makes disappearing safe rather than final.
 */
export function SetupBanner() {
  const { doneCount, total, allDone, untouched } = useSetupProgress();

  if (allDone) return null;

  if (untouched) {
    return (
      <section className={`${CARD_CLASS} flex flex-col gap-3 p-4`} aria-labelledby="setup-welcome">
        <h2 id="setup-welcome" className="text-h3">
          Welcome aboard
        </h2>
        <p className="text-body text-text-muted">
          Six one-time steps get the app pointed at your water and your gear. It takes a
          few minutes, and you can stop partway.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={ONBOARDING_PATH} className={PRIMARY_BUTTON}>
            Start setup
          </Link>
          {/*
            An escape hatch that goes nowhere on purpose: this IS the calendar. Saying so
            is what turns "you must set up first" into "you may set up first".
          */}
          <Link href="/log" className={SECONDARY_BUTTON}>
            Just log a fish
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`${CARD_CLASS} flex flex-col gap-3 p-4`} aria-labelledby="setup-progress">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="setup-progress" className="text-h3">
            Finish setting up
          </h2>
          <p className="text-caption text-text-muted">
            {doneCount} of {total} done
          </p>
        </div>
        <Link href={ONBOARDING_PATH} className={PRIMARY_BUTTON}>
          Continue setup
        </Link>
      </div>
      <div
        role="progressbar"
        aria-valuenow={doneCount}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Setup progress"
        className="h-2 w-full overflow-hidden rounded-full bg-surface-raised"
      >
        <div
          className="h-full rounded-full bg-success-green transition-[width] motion-reduce:transition-none"
          style={{ width: `${(doneCount / total) * 100}%` }}
        />
      </div>
    </section>
  );
}
