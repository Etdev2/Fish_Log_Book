"use client";

import Link from "next/link";

import type { SetupStepId } from "@/core/rules/setup-progress";

import { ONBOARDING_PATH, useSetupErrand } from "../return-to-setup";
import { useSetupProgress } from "../use-setup-progress";

/**
 * "You are here because setup sent you. Here is the way back."
 *
 * Rendered by the shell above every page, so it follows the angler wherever a step leads
 * — Settings, the Tackle Box, Setup, the Fish Log — without each of those screens having
 * to know that guided setup exists.
 *
 * It shows itself only on an errand (`?from=setup&step=…` in the URL), so the ordinary
 * app is completely unchanged for everyone who is not mid-setup. The check is cheap and
 * happens before anything reads the log store, which is why the active half is a separate
 * component: an idle visit to any screen must not pay for a store subscription it will
 * never look at.
 *
 * **The whole bar is the link.** The first version put a "Back to setup" button beside the
 * step's name, and on a 390px phone the row wrapped to two lines and stood 120px tall —
 * a persistent banner taller than the control it was escorting you to. One tap target for
 * the whole strip is both smaller and easier to hit with a wet thumb, which is the trade
 * this app makes every time it is offered.
 *
 * When the step goes green while you are standing here, the bar says so. Settings' region
 * and station controls jump back on their own the moment you choose (see
 * `useSetupErrandDone`); for the steps with no single moment of completion — a Tackle Box
 * is "done" whenever you say it is — this bar is the answer instead of a guess about when
 * you have added enough gear.
 */
export function SetupErrandBar() {
  const errand = useSetupErrand();
  if (errand === null) return null;
  return <ActiveErrandBar step={errand} />;
}

function ActiveErrandBar({ step }: { step: SetupStepId }) {
  const { steps, doneCount, total } = useSetupProgress();
  const index = steps.findIndex((candidate) => candidate.id === step);
  const current = index === -1 ? null : steps[index];
  if (!current) return null;

  return (
    <aside
      aria-label="Guided setup"
      /*
        Sticky, because a step's link lands the angler directly on the control that
        completes it (`/settings#fishing-region`) — which means the top of the page, and
        with it the way back, is already scrolled away by the time they arrive. A bar you
        have to scroll up to find is the same dead end in a nicer typeface.
      */
      className="sticky top-0 z-20 border-b border-hairline bg-surface-raised"
    >
      <Link
        href={ONBOARDING_PATH}
        className="mx-auto flex min-h-touch-floor w-full max-w-3xl items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring motion-reduce:transition-none"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-space-5 shrink-0 text-text-link"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 6-6 6 6 6" />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="block text-caption text-text-muted">
            Back to setup · step {index + 1} of {total} · {doneCount} done
          </span>
          <span className="block truncate text-body text-text-primary">{current.label}</span>
        </span>
        {/* Word, not just colour (06-accessibility-baseline). */}
        {current.done ? (
          <span className="shrink-0 text-label text-success-green">Done</span>
        ) : null}
      </Link>
    </aside>
  );
}
