"use client";

import { SPECIES, speciesById } from "@/core/ontology/species";
import { POINT_TEMPLATES } from "@/core/rules/games/modes";
import type { GameRules, RepeatRule, Tiebreaker } from "@/core/rules/games/types";
import { CARD_CLASS, CHIP_CLASS, CHIP_OFF, CHIP_ON, INPUT_CLASS, SELECT_CLASS } from "../ui-classes";

/**
 * Step 3 — the rules, and the sentence that explains them.
 *
 * Every control here writes into one `GameRules` value, which is the whole reason three
 * games did not need three settings screens. The plain-language summary at the bottom is
 * built from the same value, so it cannot drift from what the engine will actually do —
 * a rules summary written by hand is a rules summary that lies within two sprints.
 */

const DURATIONS = [
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "All day", minutes: 600 },
  { label: "No timer", minutes: null },
];

const REPEAT_OPTIONS: readonly { label: string; rule: RepeatRule; blurb: string }[] = [
  {
    label: "First three",
    rule: { kind: "capped", count: 3 },
    blurb: "Only your first three of any one species score.",
  },
  {
    label: "One each",
    rule: { kind: "unique_only" },
    blurb: "Only the first of each species scores. Variety wins.",
  },
  {
    label: "Worth less each time",
    rule: { kind: "diminishing" },
    blurb: "Full points, then half, then a quarter — never less than one.",
  },
  {
    label: "Everything counts",
    rule: { kind: "unlimited" },
    blurb: "Every fish scores full value. Simplest, and easiest to run away with.",
  },
];

const TIEBREAKERS: readonly { value: Tiebreaker; label: string }[] = [
  { value: "most_species", label: "Most different species" },
  { value: "biggest_fish", label: "Biggest fish" },
  { value: "shared_win", label: "Share the win" },
];

/** Targets worth offering: the roll-up groups first, then the fish people name. */
const TARGET_CHOICES = SPECIES.filter(
  (s) => s.takeStatus !== "protected" && (s.isGroup || s.sortOrder < 500),
).slice(0, 40);

export function GameSettings({
  rules,
  onChange,
}: {
  rules: GameRules;
  onChange: (next: GameRules) => void;
}) {
  const set = (patch: Partial<GameRules>) => onChange({ ...rules, ...patch });
  const setScoring = (patch: Partial<GameRules["scoring"]>) =>
    onChange({ ...rules, scoring: { ...rules.scoring, ...patch } });
  const setBonus = (key: keyof GameRules["scoring"]["bonuses"], value: number) =>
    setScoring({ bonuses: { ...rules.scoring.bonuses, [key]: value } });

  return (
    <div className="flex flex-col gap-space-6">
      {rules.rounds.multi_day ? (
        <Field label="Fishing days" hint="The captain closes each day by hand, so a long run offshore never ends a round early.">
          <select
            className={SELECT_CLASS}
            value={rules.rounds.count}
            onChange={(e) => set({ rounds: { ...rules.rounds, count: Number(e.target.value) } })}
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="How long" hint="The timer is a display. Nothing ends on its own — you close the game.">
          <div className="flex flex-wrap gap-space-2">
            {DURATIONS.map((d) => (
              <button
                key={d.label}
                type="button"
                aria-pressed={rules.rounds.minutes === d.minutes}
                onClick={() => set({ rounds: { ...rules.rounds, minutes: d.minutes } })}
                className={`${CHIP_CLASS} ${rules.rounds.minutes === d.minutes ? CHIP_ON : CHIP_OFF}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>
      )}

      {rules.cricket === null ? (
        <>
          <Field label="What fish are worth" hint="A starting point, not a law. Southern California values are the app's own; edit any of them.">
            <div className="flex flex-wrap gap-space-2">
              {POINT_TEMPLATES.map((template) => {
                const on = sameTiers(rules.scoring.tiers, template.tiers);
                return (
                  <button
                    key={template.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setScoring({ tiers: template.tiers })}
                    className={`${CHIP_CLASS} ${on ? CHIP_ON : CHIP_OFF}`}
                  >
                    {template.name}
                  </button>
                );
              })}
            </div>
          </Field>

          {rules.scoring.tiers.length > 0 ? (
            <Field label="Point table" hint="Change any number. A group like Rockfish covers every fish that rolls up to it.">
              <ul className="flex flex-col gap-space-2">
                {rules.scoring.tiers.map((tier, index) => (
                  <li key={tier.species_id} className="flex items-center gap-space-3">
                    <label
                      className="flex-1 text-body text-text-primary"
                      htmlFor={`tier-${tier.species_id}`}
                    >
                      {speciesById(tier.species_id)?.commonName ?? tier.species_id}
                    </label>
                    <input
                      id={`tier-${tier.species_id}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={99}
                      value={tier.points}
                      onChange={(e) => {
                        const next = [...rules.scoring.tiers];
                        next[index] = { ...tier, points: clampPoints(e.target.value) };
                        setScoring({ tiers: next });
                      }}
                      className={`${INPUT_CLASS} w-space-16 text-center`}
                    />
                  </li>
                ))}
              </ul>
            </Field>
          ) : null}

          <Field label="Anything not on the table" hint="What an eligible fish with no listed value is worth.">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={rules.scoring.default_points}
              onChange={(e) => setScoring({ default_points: clampPoints(e.target.value) })}
              className={`${INPUT_CLASS} w-space-16 text-center`}
              aria-label="Points for an unlisted species"
            />
          </Field>

          <Field label="Same fish again" hint="Stops one hot bite on an easy species winning the day.">
            <div className="flex flex-col gap-space-2">
              {REPEAT_OPTIONS.map((option) => {
                const on = option.rule.kind === rules.scoring.repeat.kind;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setScoring({ repeat: option.rule })}
                    className={`${CARD_CLASS} min-h-touch-floor p-space-3 text-left ${
                      on ? "border-signal-orange" : ""
                    }`}
                  >
                    <span className="block text-body-strong text-text-primary">{option.label}</span>
                    <span className="block text-caption text-text-muted">{option.blurb}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Bonuses" hint="Points on top of the fish's own value.">
            <ul className="flex flex-col gap-space-3">
              <BonusRow label="First fish of the game" value={rules.scoring.bonuses.first_blood} onChange={(v) => setBonus("first_blood", v)} />
              <BonusRow label="A species new to that angler" value={rules.scoring.bonuses.new_species} onChange={(v) => setBonus("new_species", v)} />
              <BonusRow label="A personal best" value={rules.scoring.bonuses.personal_best} onChange={(v) => setBonus("personal_best", v)} />
              <BonusRow label="Released" value={rules.scoring.bonuses.release} onChange={(v) => setBonus("release", v)} />
              <BonusRow label="Biggest of the round" value={rules.scoring.bonuses.biggest_of_round} onChange={(v) => setBonus("biggest_of_round", v)} />
            </ul>
          </Field>
        </>
      ) : (
        <>
          <Field label="Targets" hint="Pick a handful. Groups like Rockfish count any fish in them, which helps when nobody can name it to species.">
            <div className="flex flex-wrap gap-space-2">
              {TARGET_CHOICES.map((species) => {
                const on = rules.cricket?.targets.includes(species.id) ?? false;
                return (
                  <button
                    key={species.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      const cricket = rules.cricket;
                      if (!cricket) return;
                      const targets = on
                        ? cricket.targets.filter((t) => t !== species.id)
                        : [...cricket.targets, species.id];
                      set({ cricket: { ...cricket, targets } });
                    }}
                    className={`${CHIP_CLASS} ${on ? CHIP_ON : CHIP_OFF}`}
                  >
                    {species.commonName}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Marks to close a target" hint="Three is the darts default and the one people expect.">
            <select
              className={SELECT_CLASS}
              value={rules.cricket.marks_to_close}
              onChange={(e) =>
                rules.cricket &&
                set({ cricket: { ...rules.cricket, marks_to_close: Number(e.target.value) } })
              }
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} marks
                </option>
              ))}
            </select>
          </Field>

          <Toggle
            label="A measured fish counts double"
            hint="Length or weight entered = two marks instead of one."
            on={rules.cricket.size_bonus_marks}
            onChange={(on) => rules.cricket && set({ cricket: { ...rules.cricket, size_bonus_marks: on } })}
          />
          <Toggle
            label="A personal best closes it outright"
            hint="Three marks in one fish."
            on={rules.cricket.personal_best_marks}
            onChange={(on) => rules.cricket && set({ cricket: { ...rules.cricket, personal_best_marks: on } })}
          />
        </>
      )}

      {rules.elimination !== null ? (
        <>
          <Field label="Who goes home" hint="Applied when the captain closes each day.">
            <div className="flex flex-col gap-space-2">
              {([
                { kind: "lowest", label: "Lowest score", blurb: "Everyone tied at the bottom goes, rather than the app picking one." },
                { kind: "top_half", label: "Keep the top half", blurb: "Halves the field each day. Short and brutal." },
              ] as const).map((option) => {
                const on = rules.elimination?.rule.kind === option.kind;
                return (
                  <button
                    key={option.kind}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      rules.elimination &&
                      set({ elimination: { ...rules.elimination, rule: { kind: option.kind } } })
                    }
                    className={`${CARD_CLASS} min-h-touch-floor p-space-3 text-left ${on ? "border-signal-orange" : ""}`}
                  >
                    <span className="block text-body-strong text-text-primary">{option.label}</span>
                    <span className="block text-caption text-text-muted">{option.blurb}</span>
                  </button>
                );
              })}
            </div>
          </Field>
          <Toggle
            label="Carry scores between days"
            hint="Off means every day starts level, so one bad morning is not the end of it."
            on={rules.rounds.carry_scores}
            onChange={(on) => set({ rounds: { ...rules.rounds, carry_scores: on } })}
          />
        </>
      ) : null}

      <Field label="If it ends level" hint="">
        <select
          className={SELECT_CLASS}
          value={rules.tiebreaker}
          onChange={(e) => set({ tiebreaker: e.target.value as Tiebreaker })}
        >
          {TIEBREAKERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Toggle
        label="Captain confirms each fish"
        hint="Off is the honor system, which is what a family trip wants."
        on={rules.host_approval}
        onChange={(on) => set({ host_approval: on })}
      />

      <section className={`${CARD_CLASS} flex flex-col gap-space-2 p-space-4`} aria-live="polite">
        <h3 className="text-body-strong text-text-primary">How this game will work</h3>
        <ul className="flex flex-col gap-space-2">
          {explainRules(rules).map((line) => (
            <li key={line} className="text-body text-text-muted">
              {line}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * The rules, in the words a captain would use telling the boat what they are playing.
 *
 * Derived from the same `GameRules` the engine folds, so this can only be wrong if the
 * engine is wrong too. Exported for its test.
 */
export function explainRules(rules: GameRules): readonly string[] {
  const lines: string[] = [];

  if (rules.cricket !== null) {
    const names = rules.cricket.targets
      .map((t) => speciesById(t)?.commonName ?? t)
      .join(", ");
    lines.push(
      `Close ${rules.cricket.targets.length} targets — ${names || "none picked yet"} — with ${rules.cricket.marks_to_close} of each.`,
    );
    if (rules.cricket.size_bonus_marks) lines.push("A fish you measure counts as two toward closing.");
    if (rules.cricket.personal_best_marks) lines.push("A personal best closes a target on its own.");
    lines.push("Once you have closed a target it scores points for you, until everyone else closes it too.");
  } else {
    lines.push(
      rules.scoring.tiers.length > 0
        ? `Fish are worth ${Math.min(...rules.scoring.tiers.map((t) => t.points))} to ${Math.max(...rules.scoring.tiers.map((t) => t.points))} points, and anything unlisted is worth ${rules.scoring.default_points}.`
        : `Every fish is worth ${rules.scoring.default_points}.`,
    );
    switch (rules.scoring.repeat.kind) {
      case "capped":
        lines.push(`Only your first ${rules.scoring.repeat.count} of any one species score.`);
        break;
      case "unique_only":
        lines.push("Only the first of each species scores — it is a hunt for variety.");
        break;
      case "diminishing":
        lines.push("Each repeat of a species is worth half the last, down to one point.");
        break;
      case "unlimited":
        lines.push("Every fish scores its full value, however many you catch.");
        break;
    }
    const bonuses = Object.entries(rules.scoring.bonuses).filter(([, v]) => v > 0);
    if (bonuses.length > 0) {
      lines.push(
        `Bonuses on top: ${bonuses.map(([k, v]) => `${BONUS_WORDS[k] ?? k} (+${v})`).join(", ")}.`,
      );
    }
  }

  if (rules.elimination !== null) {
    lines.push(
      rules.elimination.rule.kind === "top_half"
        ? `${rules.rounds.count} days, and only the top half survive each one.`
        : `${rules.rounds.count} days, and the lowest score goes out at the end of each one.`,
    );
    lines.push(
      rules.rounds.carry_scores
        ? "Scores carry from day to day."
        : "Scores start level again every day.",
    );
    lines.push("Knocked out? Your fish still count on the trip — just not for the cup.");
  } else if (rules.rounds.minutes !== null) {
    lines.push(`Runs about ${rules.rounds.minutes >= 60 ? `${Math.round(rules.rounds.minutes / 60)} hours` : `${rules.rounds.minutes} minutes`}. Nothing ends by itself — you close the game.`);
  } else {
    lines.push("No timer. The game ends when you close it.");
  }

  lines.push(
    rules.host_approval
      ? "You confirm each fish before it scores."
      : "Honor system — a fish scores the moment it is logged.",
  );

  // Not configurable, and stated every time, because it is the promise the game makes.
  lines.push(
    "Protected fish score nothing, and a fish kept when it should have gone back scores nothing. Releasing never costs you points.",
  );

  return lines;
}

const BONUS_WORDS: Record<string, string> = {
  first_blood: "first fish of the game",
  new_species: "a species new to you",
  personal_best: "a personal best",
  release: "releasing it",
  biggest_of_round: "biggest of the round",
};

function sameTiers(
  a: GameRules["scoring"]["tiers"],
  b: GameRules["scoring"]["tiers"],
): boolean {
  return a.length === b.length && a.every((t, i) => t.species_id === b[i].species_id && t.points === b[i].points);
}

function clampPoints(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(99, n));
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-space-2">
      <h3 className="text-body-strong text-text-primary">{label}</h3>
      {hint ? <p className="text-caption text-text-muted">{hint}</p> : null}
      {children}
    </section>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`${CARD_CLASS} flex min-h-touch-floor items-center justify-between gap-space-3 p-space-3 text-left ${
        on ? "border-signal-orange" : ""
      }`}
    >
      <span className="flex flex-col">
        <span className="text-body-strong text-text-primary">{label}</span>
        <span className="text-caption text-text-muted">{hint}</span>
      </span>
      <span className={`text-label ${on ? "text-signal-orange" : "text-text-muted"}`}>
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}

function BonusRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = `bonus-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <li className="flex items-center gap-space-3">
      <label htmlFor={id} className="flex-1 text-body text-text-primary">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        value={value}
        onChange={(e) => onChange(clampPoints(e.target.value))}
        className={`${INPUT_CLASS} w-space-16 text-center`}
      />
    </li>
  );
}
