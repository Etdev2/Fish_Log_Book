"use client";

import { useId } from "react";

import type { CrewMember, CrewProblem } from "@/core/tournaments/registration";

import { CARD_PADDED, INPUT, SECONDARY_BUTTON, TERTIARY_BUTTON } from "../ui-classes";

/**
 * Who is on the boat: a captain, and everyone fishing with them.
 *
 * One list, with the captain marked in it, rather than a "captain" panel above a "crew"
 * panel. The captain is a member of the crew who also answers the phone; splitting them
 * into two sections would mean a solo angler filling in two forms about one person.
 *
 * The phone number is required for the captain and optional for everyone else, and the
 * hint says why. A required field with no stated reason is the kind of thing people put
 * fake data into.
 */
export function CrewSection({
  crew,
  problems,
  onChange,
  disabled,
}: {
  crew: readonly CrewMember[];
  problems: readonly CrewProblem[];
  onChange: (next: readonly CrewMember[]) => void;
  disabled: boolean;
}) {
  const groupId = useId();

  const update = (id: string, patch: Partial<CrewMember>) =>
    onChange(crew.map((member) => (member.id === id ? { ...member, ...patch } : member)));

  const setCaptain = (id: string) =>
    onChange(crew.map((member) => ({ ...member, isCaptain: member.id === id })));

  const add = () =>
    onChange([
      ...crew,
      {
        id: `crew-${Date.now()}`,
        displayName: "",
        email: null,
        phone: null,
        isCaptain: crew.length === 0,
      },
    ]);

  const remove = (id: string) => {
    const next = crew.filter((member) => member.id !== id);
    // Removing the captain must not leave a boat with nobody in charge. The first person
    // left takes the wheel, which is what happens on an actual boat.
    if (next.length > 0 && !next.some((member) => member.isCaptain)) {
      onChange(next.map((member, index) => ({ ...member, isCaptain: index === 0 })));
      return;
    }
    onChange(next);
  };

  const captainMissingPhone = problems.some((problem) => problem.kind === "captain-no-phone");
  const blankNames = new Set(
    problems.flatMap((problem) => (problem.kind === "blank-name" ? [problem.memberId] : [])),
  );

  return (
    <section className="flex flex-col gap-space-3" aria-labelledby={`${groupId}-heading`}>
      <h2 id={`${groupId}-heading`} className="text-h3 text-text-primary">
        Who is fishing
      </h2>
      <p className="text-body text-text-muted">
        Everyone on the boat, and which of you is the captain. The captain&rsquo;s number is
        how the host reaches you if the weather turns.
      </p>

      <ul className="flex flex-col gap-space-3">
        {crew.map((member, index) => (
          <li key={member.id} className={`${CARD_PADDED} flex flex-col gap-space-3`}>
            <div className="flex items-center justify-between gap-space-3">
              <h3 className="text-body-strong text-text-primary">
                {member.isCaptain ? "Captain" : `Angler ${index + 1}`}
              </h3>
              {crew.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(member.id)}
                  disabled={disabled}
                  className={TERTIARY_BUTTON}
                >
                  Remove
                </button>
              ) : null}
            </div>

            <label className="flex flex-col gap-space-1">
              <span className="text-caption text-text-muted">Name</span>
              <input
                type="text"
                value={member.displayName}
                disabled={disabled}
                onChange={(event) => update(member.id, { displayName: event.target.value })}
                aria-invalid={blankNames.has(member.id)}
                className={INPUT}
                autoComplete="name"
              />
              {blankNames.has(member.id) ? (
                <span className="text-caption text-error-red">Every angler needs a name.</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-space-1">
              <span className="text-caption text-text-muted">
                Phone {member.isCaptain ? "(required)" : "(optional)"}
              </span>
              <input
                type="tel"
                value={member.phone ?? ""}
                disabled={disabled}
                onChange={(event) => update(member.id, { phone: event.target.value })}
                aria-invalid={member.isCaptain && captainMissingPhone}
                className={INPUT}
                autoComplete="tel"
              />
              {member.isCaptain && captainMissingPhone ? (
                <span className="text-caption text-error-red">
                  The host needs a number that will be answered on the day.
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-space-1">
              <span className="text-caption text-text-muted">Email (optional)</span>
              <input
                type="email"
                value={member.email ?? ""}
                disabled={disabled}
                onChange={(event) => update(member.id, { email: event.target.value })}
                className={INPUT}
                autoComplete="email"
              />
            </label>

            {!member.isCaptain ? (
              <button
                type="button"
                onClick={() => setCaptain(member.id)}
                disabled={disabled}
                className={`${SECONDARY_BUTTON} self-start`}
              >
                Make captain
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <button type="button" onClick={add} disabled={disabled} className={`${SECONDARY_BUTTON} self-start`}>
        + Add another angler
      </button>
    </section>
  );
}
