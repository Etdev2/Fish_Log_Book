import type { CatchRecord, LocationConditionRecord, RigRecord } from "./catch/types";

/**
 * The five-step guided setup checklist (founder spec §1).
 *
 * **A step is a memory that something was done once, not a readout of today.** That is
 * the whole design, and it is the difference between a checklist people follow and one
 * they learn to ignore.
 *
 * The data under steps 1 and 4 is genuinely per-trip: a location describes right now, and
 * a new trip starts with none. If the checklist asked "is there a location on *this*
 * trip", it would flip back to incomplete every outing for somebody who has fished for a
 * decade. So each step latches: once true, it stays true.
 *
 * Latching is also why this cannot be derived from live data alone. Present state answers
 * "do you have tackle", not "have you ever added tackle", and those differ in exactly the
 * case that matters — an angler who clears out their box should not be marched back
 * through the tutorial. The caller keeps the latched set and passes it in; `evaluate`
 * unions it with what the log shows now.
 */

export const SETUP_STEPS = ["location", "tackle", "rod", "conditions", "catch"] as const;

export type SetupStepId = (typeof SETUP_STEPS)[number];

export interface SetupStep {
  readonly id: SetupStepId;
  readonly label: string;
  readonly hint: string;
  readonly href: string;
  readonly done: boolean;
}

const COPY: Record<SetupStepId, { label: string; hint: string; href: string }> = {
  location: {
    label: "Set a fishing location",
    hint: "Where are you fishing?",
    href: "/setup",
  },
  tackle: {
    label: "Add gear to your Tackle Box",
    hint: "Rods, reels, line, hooks — whatever's in your box.",
    href: "/tackle",
  },
  rod: {
    label: "Build a rod setup",
    hint: "Pair your gear into a rod you can fish with.",
    href: "/setup",
  },
  conditions: {
    label: "Add today's conditions",
    hint: "Current, structure, water — what you see out there.",
    href: "/setup",
  },
  catch: {
    label: "Log your first fish",
    hint: "One tap, from here or the Log tab.",
    href: "/log",
  },
};

/**
 * A location counts for step 4 once it carries an observation, not just a name. Naming a
 * spot and describing the water are two different acts, and the founder listed them as
 * two different steps.
 */
function hasConditions(location: LocationConditionRecord): boolean {
  return (
    location.current_term !== null ||
    location.current_strength !== null ||
    location.structure_type_ids.length > 0 ||
    location.bottom_depth_m !== null ||
    location.water_color_id !== null ||
    location.water_clarity_id !== null
  );
}

/** What the log shows right now. Not the answer on its own — see the latch above. */
export function observedSteps(input: {
  readonly catches: readonly CatchRecord[];
  readonly rigs: readonly RigRecord[];
  readonly locations: readonly LocationConditionRecord[];
  readonly tackleItemCount: number;
}): ReadonlySet<SetupStepId> {
  const live = new Set<SetupStepId>();
  const locations = input.locations.filter((l) => l.deleted_at === null);

  if (locations.length > 0) live.add("location");
  if (input.tackleItemCount > 0) live.add("tackle");
  if (input.rigs.length > 0) live.add("rod");
  if (locations.some(hasConditions)) live.add("conditions");
  if (input.catches.some((c) => c.deleted_at === null)) live.add("catch");

  return live;
}

/**
 * The five steps as the card should render them.
 *
 * `latched` is what the device already remembers; `observed` is what the log says now.
 * A step is done if either says so, which is what makes it one-way.
 */
export function setupSteps(
  latched: ReadonlySet<SetupStepId>,
  observed: ReadonlySet<SetupStepId>,
): readonly SetupStep[] {
  return SETUP_STEPS.map((id) => ({
    id,
    ...COPY[id],
    done: latched.has(id) || observed.has(id),
  }));
}

/** Newly true steps the caller should write down, so they survive the data changing. */
export function stepsToLatch(
  latched: ReadonlySet<SetupStepId>,
  observed: ReadonlySet<SetupStepId>,
): readonly SetupStepId[] {
  return [...observed].filter((id) => !latched.has(id));
}

export function allStepsDone(steps: readonly SetupStep[]): boolean {
  return steps.every((step) => step.done);
}
