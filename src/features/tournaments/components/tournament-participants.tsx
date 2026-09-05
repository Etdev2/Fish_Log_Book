"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { setDemoCheckIn } from "../demo-field";
import { boardName, boardSubtitle, fieldSummary, isInTheField, searchField, type FieldEntry } from "../field";
import { entrySteps } from "../format";
import { useField } from "../use-field";
import { useDemoMode, useTournament } from "../use-tournament";
import {
  CARD,
  CARD_PADDED,
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  FOCUS_RING,
  INPUT,
  PAGE,
  SECONDARY_BUTTON,
  TABULAR,
} from "../ui-classes";
import { CheckIcon, PendingIcon } from "./icons";
import {
  BackLink,
  DemoNote,
  EmptyState,
  ErrorScreen,
  LoadingScreen,
  SectionHeading,
  StatTile,
  TonePill,
  TournamentTabs,
} from "./tournament-chrome";
import { TournamentInvite } from "./tournament-invite";

/**
 * /tournaments/[id]/participants — the field.
 *
 * This screen did not exist, and its absence was the largest hole in the section: you
 * could create a tournament and enter one, but there was no way to see who was in it. For
 * a director that is the first question ("where are my eighty boats?"), and for three
 * friends it is most of the product ("is Dad in yet?").
 *
 * It is one screen for both, which is the whole B2C/B2B bet (UX-001 §13): a four-person
 * family event and an eighty-boat offshore tournament are the same list, and the parts a
 * small event does not need — the search box, the filters, the check-in counts — appear
 * because the field is big, not because somebody bought a different product.
 */

type Filter = "all" | "not-checked-in" | "attention";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Everyone" },
  { value: "not-checked-in", label: "Not checked in" },
  { value: "attention", label: "Needs a look" },
];

/** The size at which a list stops being readable by eye and needs a search box. */
const SEARCHABLE_FROM = 8;

/** One shared empty array, so "still loading" does not look like a new field every render. */
const NO_FIELD: readonly FieldEntry[] = [];

export function TournamentParticipants({ tournamentId }: { tournamentId: string }) {
  const load = useTournament(tournamentId);
  const fieldLoad = useField(tournamentId);
  const demoMode = useDemoMode();
  const fieldId = useId();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [checkInTick, setCheckInTick] = useState(0);
  const { reload } = fieldLoad;

  // A check-in writes to the device and then the field is read again, rather than the row
  // being patched in place. One source of truth for who is checked in, even when the change
  // came from this screen.
  useEffect(() => {
    if (checkInTick > 0) reload();
  }, [checkInTick, reload]);

  const field = fieldLoad.state === "ready" ? fieldLoad.field : NO_FIELD;
  const summary = useMemo(() => fieldSummary(field), [field]);

  const shown = useMemo(() => {
    const searched = searchField(field, query);
    if (filter === "not-checked-in") {
      return searched.filter((entry) => isInTheField(entry) && entry.checkInStatus === "NOT_CHECKED_IN");
    }
    if (filter === "attention") {
      return searched.filter(
        (entry) =>
          isInTheField(entry) &&
          (entry.registrationStatus === "PENDING" ||
            entry.registrationStatus === "WAITLISTED" ||
            entry.eligibilityStatus === "PENDING_REVIEW" ||
            entry.eligibilityStatus === "INELIGIBLE"),
      );
    }
    return searched;
  }, [field, filter, query]);

  if (load.state === "loading") return <LoadingScreen label="Loading the field" />;
  if (load.state === "error") return <ErrorScreen message={load.message} />;
  if (fieldLoad.state === "error") return <ErrorScreen message={fieldLoad.message} onRetry={reload} />;

  const tournament = load.tournament;
  const out = field.filter((entry) => !isInTheField(entry));

  return (
    <div className={PAGE}>
      <header className="flex flex-col gap-space-3">
        <BackLink href={`/tournaments/${tournament.id}/overview`}>{tournament.name}</BackLink>
        <div className="flex flex-wrap items-end justify-between gap-space-3">
          <h1 className="text-h1 text-text-primary">Who&apos;s in</h1>
          <span className={`text-body ${TABULAR} text-text-muted`}>
            {summary.entered} {summary.entered === 1 ? "entry" : "entries"}
          </span>
        </div>
      </header>

      <TournamentTabs tournamentId={tournament.id} />

      {field.length === 0 ? (
        <>
          <EmptyState
            title="Nobody has entered yet"
            body="Everyone who enters shows up here with their boat, their number, and whether they have checked in."
          />
          <TournamentInvite tournamentId={tournament.id} visibility={tournament.visibility} />
        </>
      ) : (
        <>
          {/*
            Four numbers a director reads out loud at a captains' meeting. They are counts
            of the same list below, computed in one place (`field.ts`), so the roster can
            never say twelve while the summary says fourteen.
          */}
          <section className="grid grid-cols-2 gap-space-3 sm:grid-cols-4" aria-label="The field at a glance">
            <StatTile label="Entered" value={String(summary.entered)} />
            <StatTile label="Checked in" value={`${summary.checkedIn}/${summary.entered}`} />
            <StatTile label="On the board" value={String(summary.onTheBoard)} />
            <StatTile
              label="Needs a look"
              value={String(summary.needsAttention)}
              tone={summary.needsAttention > 0 ? "attention" : "neutral"}
            />
          </section>

          {field.length >= SEARCHABLE_FROM ? (
            <div className="flex flex-col gap-space-3">
              <label className="flex flex-col gap-space-2">
                <span className="text-label text-text-primary">Find a boat</span>
                <input
                  id={`${fieldId}-search`}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className={INPUT}
                  placeholder="Name, boat, team, or number"
                  autoComplete="off"
                />
              </label>

              <div className="flex flex-wrap gap-space-2" role="group" aria-label="Filter the field">
                {FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={filter === option.value}
                    onClick={() => setFilter(option.value)}
                    className={`${CHIP} ${filter === option.value ? CHIP_ON : CHIP_OFF}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {shown.filter(isInTheField).length === 0 ? (
            <EmptyState
              title="Nothing matches"
              body={
                query.trim().length > 0
                  ? `No entry matches “${query.trim()}”. Try the boat name or the number on the hull.`
                  : "Nobody is in this state right now."
              }
              action={
                <button type="button" className={SECONDARY_BUTTON} onClick={() => { setQuery(""); setFilter("all"); }}>
                  Show everyone
                </button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-space-3">
              {shown.filter(isInTheField).map((entry) => (
                <ParticipantRow
                  key={entry.entryId}
                  entry={entry}
                  canCheckIn={demoMode}
                  onCheckIn={(status) => {
                    setDemoCheckIn(tournamentId, entry.entryId, status);
                    setCheckInTick((value) => value + 1);
                  }}
                />
              ))}
            </ul>
          )}

          {/*
            Entries that are out of the tournament are kept, below the line, rather than
            deleted from the view. A withdrawn boat is a thing that happened, and a director
            asked "what happened to 16?" needs an answer.
          */}
          {out.length > 0 && filter === "all" && query.trim().length === 0 ? (
            <section className="flex flex-col gap-space-3" aria-labelledby="out-heading">
              <SectionHeading aside={`${out.length}`}>
                <span id="out-heading">Not fishing</span>
              </SectionHeading>
              <ul className="flex flex-col gap-space-2">
                {out.map((entry) => (
                  <li key={entry.entryId} className={`${CARD} flex items-center justify-between gap-space-3 p-space-3`}>
                    <span className="flex flex-col">
                      <span className="text-body text-text-muted">{boardName(entry)}</span>
                      {boardSubtitle(entry) ? (
                        <span className="text-caption text-text-muted">{boardSubtitle(entry)}</span>
                      ) : null}
                    </span>
                    <TonePill tone="stopped">{registrationWord(entry)}</TonePill>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <TournamentInvite tournamentId={tournament.id} visibility={tournament.visibility} />
        </>
      )}

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}

/** The four entry states, in the shape `entrySteps` reads them. */
function stepsFor(entry: FieldEntry) {
  return entrySteps({
    registration_status: entry.registrationStatus,
    eligibility_status: entry.eligibilityStatus,
    check_in_status: entry.checkInStatus,
    competition_status: entry.competitionStatus,
  });
}

/** "Withdrawn", "Not accepted", "Cancelled" — why this entry is below the line. */
function registrationWord(entry: FieldEntry): string {
  return stepsFor(entry)[0].value;
}

/**
 * One entry. The number on the hull is the anchor, because that is what gets shouted across
 * a dock; the name is second.
 */
function ParticipantRow({
  entry,
  canCheckIn,
  onCheckIn,
}: {
  entry: FieldEntry;
  canCheckIn: boolean;
  onCheckIn: (status: string) => void;
}) {
  const checkedIn = entry.checkInStatus === "CHECKED_IN";
  const steps = stepsFor(entry);

  // Only the states worth a pill. A confirmed, eligible entry needs no decoration — the
  // row being there is the information, and four green pills on every row is noise that
  // hides the one row that is not fine.
  const flags = [
    entry.registrationStatus === "CONFIRMED" ? null : steps[0],
    entry.eligibilityStatus === "ELIGIBLE" || entry.eligibilityStatus === "UNKNOWN" ? null : steps[1],
  ].filter((step): step is NonNullable<typeof step> => step !== null);

  return (
    <li className={`${CARD_PADDED} flex flex-col gap-space-3`}>
      <div className="flex items-start gap-space-3">
        <span
          className={`flex h-space-10 w-space-10 shrink-0 items-center justify-center rounded-md border text-body-strong ${TABULAR} ${
            entry.isYou
              ? "border-signal-orange bg-signal-orange/10 text-signal-orange"
              : "border-hairline bg-background text-text-muted"
          }`}
          aria-hidden={entry.entryNumber === null}
        >
          {entry.entryNumber ?? "–"}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-space-1">
          <span className="flex flex-wrap items-center gap-space-2">
            <span className="text-body-strong text-text-primary">{boardName(entry)}</span>
            {entry.isYou ? <TonePill tone="live">You</TonePill> : null}
          </span>
          {boardSubtitle(entry) ? (
            <span className="text-caption text-text-muted">{boardSubtitle(entry)}</span>
          ) : null}
          {entry.bestWeightLb !== null ? (
            <span className={`text-caption ${TABULAR} text-text-muted`}>
              Best so far: {entry.bestWeightLb.toFixed(1)} lb {entry.species ? `· ${entry.species}` : ""}
              {entry.awaitingReview ? " · waiting on a review" : ""}
            </span>
          ) : null}
        </span>

        {/*
          Check-in rides on the row rather than sitting under it as a full-width button.
          Thirteen boats × a 48px button each was most of the length of this screen, and a
          director working down a list at the ramp wants the next boat on screen, not the
          last one's control.
        */}
        {canCheckIn ? (
          <button
            type="button"
            aria-label={
              checkedIn ? `Undo check-in for ${boardName(entry)}` : `Check in ${boardName(entry)}`
            }
            onClick={() => onCheckIn(checkedIn ? "NOT_CHECKED_IN" : "CHECKED_IN")}
            className={`${FOCUS_RING} inline-flex min-h-touch-floor shrink-0 items-center gap-space-2 rounded-md border px-space-3 text-caption transition-colors active:scale-95 motion-reduce:transition-none ${
              checkedIn
                ? "border-success-green/40 bg-success-green/10 text-success-green"
                : "border-border-interactive bg-surface-raised text-text-primary"
            }`}
          >
            {checkedIn ? <CheckIcon size="h-space-4 w-space-4" /> : <PendingIcon size="h-space-4 w-space-4" />}
            {checkedIn ? "In" : "Check in"}
          </button>
        ) : (
          <span
            className={`inline-flex shrink-0 items-center gap-space-2 text-caption ${
              checkedIn ? "text-success-green" : "text-text-muted"
            }`}
          >
            {checkedIn ? <CheckIcon size="h-space-4 w-space-4" /> : <PendingIcon size="h-space-4 w-space-4" />}
            {checkedIn ? "In" : "Not in"}
          </span>
        )}
      </div>

      {flags.length > 0 ? (
        <ul className="flex flex-wrap gap-space-2">
          {flags.map((step) => (
            <li key={step.label}>
              <TonePill tone={step.tone}>{step.value}</TonePill>
            </li>
          ))}
        </ul>
      ) : null}

    </li>
  );
}
