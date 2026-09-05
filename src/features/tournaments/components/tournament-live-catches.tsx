"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { countdown, qrPresentation, syncPresentation, tournamentPhase, TONE_CLASSES } from "../format";
import {
  getDemoTournamentCatches,
  queueDemoCatch,
  saveDemoCatch,
  syncDemoCatch,
  type DemoTournamentCatch,
} from "../live-catch-demo";
import { useDemoMode, useTournament } from "../use-tournament";
import { useNow, useOnline } from "../use-now";
import {
  BIG_ACTION,
  CARD,
  CARD_PADDED,
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  FOCUS_RING,
  INPUT,
  INSET,
  PAGE,
  SECONDARY_BUTTON,
  TABULAR,
} from "../ui-classes";
import { AlertIcon, CheckIcon, ClockIcon, PendingIcon } from "./icons";
import {
  BackLink,
  ConnectionPill,
  DemoNote,
  EmptyState,
  ErrorScreen,
  LoadingScreen,
  SectionHeading,
  TonePill,
  TournamentTabs,
} from "./tournament-chrome";

type QrState = DemoTournamentCatch["qr_state"];

const QR_STATES: Array<{ value: QrState; label: string }> = [
  { value: "VALID", label: "Scanned, good" },
  { value: "NOT_SCANNED", label: "No code" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REUSED", label: "Already used" },
  { value: "WRONG_CONTEXT", label: "Wrong event" },
];

/**
 * /tournaments/[id]/catches — the screen that gets used with one wet hand.
 *
 * Everything here is arranged around the promise the app can actually keep offshore:
 * **the catch is written to this phone the instant you tap save, and it is never quietly
 * changed after that.** The sync state says exactly where each catch has got to, in words
 * that do not overclaim — "Saved on this phone" is not "verified", and the old copy's
 * "Synced" pill was the closest this screen came to lying to somebody.
 *
 * This is also the screen that used to crash. It read `navigator.onLine` in the render
 * body, which is a `ReferenceError` in the server render every page in this app still
 * gets, so the whole route fell through to `error.tsx` before a single field was drawn.
 */
export function TournamentLiveCatches({ tournamentId }: { tournamentId: string }) {
  const load = useTournament(tournamentId);
  const demoMode = useDemoMode();
  const online = useOnline();
  const now = useNow();
  const fieldId = useId();

  const [catches, setCatches] = useState<DemoTournamentCatch[]>([]);
  const [species, setSpecies] = useState("");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [gpsCaptured, setGpsCaptured] = useState(true);
  const [qrState, setQrState] = useState<QrState>("VALID");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setCatches(getDemoTournamentCatches(tournamentId));
  }, [tournamentId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // `localStorage` is not there during the server render, and setting state
      // synchronously in an effect body is a cascading render. One yield solves both.
      await Promise.resolve();
      if (!cancelled) refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!demoMode) {
      setMessage(
        "This build records tournament catches on the phone only — the connection to the tournament scorer is not switched on yet. Nothing you enter here has been sent anywhere.",
      );
      return;
    }

    const item = saveDemoCatch({
      tournamentId,
      species: species.trim(),
      weightLb: weight ? Number(weight) : null,
      lengthIn: length ? Number(length) : null,
      photoName,
      gpsCaptured,
      qrState,
    });

    setMessage(
      item.fair_play_messages.length > 0
        ? `${item.species} saved on this phone. A couple of things on it will need a person to look — they are listed on the catch.`
        : `${item.species} saved on this phone. It goes to the scorer when you have service.`,
    );
    setSpecies("");
    setWeight("");
    setLength("");
    setPhotoName(null);
    refresh();
  }

  function queue(id: string) {
    queueDemoCatch(id);
    setMessage("Queued. It will go up on its own when there is service.");
    refresh();
  }

  function sync(id: string) {
    syncDemoCatch(id);
    setMessage(
      "Sent. A retry uses the same catch, so trying twice can never put two of the same fish on the board.",
    );
    refresh();
  }

  if (load.state === "loading") return <LoadingScreen label="Loading catches" />;
  if (load.state === "error") return <ErrorScreen message={load.message} />;

  const tournament = load.tournament;
  const phase = tournamentPhase(tournament.status);
  const clock = now === 0 ? null : countdown(now, { status: tournament.status, startsAt: tournament.starts_at, endsAt: tournament.ends_at });

  return (
    <div className={PAGE}>
      <header className="flex flex-col gap-space-3">
        <BackLink href={`/tournaments/${tournament.id}/overview`}>{tournament.name}</BackLink>
        <div className="flex flex-wrap items-end justify-between gap-space-3">
          <h1 className="text-h1 text-text-primary">Log a catch</h1>
          <div className="flex flex-wrap items-center gap-space-2">
            <ConnectionPill />
            {clock ? (
              <span
                className={`inline-flex items-center gap-space-2 text-caption ${clock.urgent ? "text-signal-orange" : "text-text-muted"}`}
              >
                <ClockIcon size="h-space-4 w-space-4" />
                <span className={TABULAR}>{clock.label}</span>
              </span>
            ) : null}
          </div>
        </div>
        <p className="text-body text-text-muted">
          Write it down first, send it second. Nothing here needs service to work.
        </p>
      </header>

      <TournamentTabs tournamentId={tournament.id} />

      {phase !== "during" ? (
        <p className={`${INSET} flex items-start gap-space-3 text-body text-text-primary`} role="status">
          <span className="mt-space-1 text-amber-flag">
            <AlertIcon />
          </span>
          <span>
            This tournament is not being fished right now
            {tournament.status === "PAUSED" ? " — it is paused" : ""}. You can still record a catch and
            it will be kept exactly as you entered it, but it will not score unless a judge decides it
            should.
          </span>
        </p>
      ) : null}

      <form onSubmit={submit} className={`${CARD_PADDED} flex flex-col gap-space-5`}>
        <label className="flex flex-col gap-space-2">
          <span className="text-label text-text-primary">What is it?</span>
          <input
            id={`${fieldId}-species`}
            required
            value={species}
            onChange={(event) => setSpecies(event.target.value)}
            className={INPUT}
            placeholder="Yellowtail"
            autoComplete="off"
          />
        </label>

        <div className="grid grid-cols-2 gap-space-3">
          <label className="flex flex-col gap-space-2">
            <span className="text-label text-text-primary">Weight</span>
            <input
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className={INPUT}
              placeholder="18.4"
              aria-describedby={`${fieldId}-weight-unit`}
            />
            <span id={`${fieldId}-weight-unit`} className="text-caption text-text-muted">
              Pounds
            </span>
          </label>
          <label className="flex flex-col gap-space-2">
            <span className="text-label text-text-primary">Length</span>
            <input
              inputMode="decimal"
              type="number"
              min="0"
              step="0.1"
              value={length}
              onChange={(event) => setLength(event.target.value)}
              className={INPUT}
              placeholder="34.5"
              aria-describedby={`${fieldId}-length-unit`}
            />
            <span id={`${fieldId}-length-unit`} className="text-caption text-text-muted">
              Inches
            </span>
          </label>
        </div>

        {/*
          Evidence. Presented as three things you either have or you do not, rather than as
          three form controls — the angler's question is "is this catch going to stand", and
          a missing photo is the answer to it.
        */}
        <fieldset className="flex flex-col gap-space-3">
          <legend className="text-label text-text-primary">Proof</legend>

          <label
            className={`${INSET} ${FOCUS_RING} flex min-h-touch-floor cursor-pointer items-start gap-space-3`}
          >
            <span className={`mt-space-1 ${photoName ? "text-success-green" : "text-text-muted"}`}>
              {photoName ? <CheckIcon /> : <PendingIcon />}
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-body text-text-primary">{photoName ? "Photo added" : "Add a photo"}</span>
              <span className="text-caption text-text-muted">
                {photoName ?? "Most events want one. Without it, a judge decides."}
              </span>
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? null)}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            aria-pressed={gpsCaptured}
            onClick={() => setGpsCaptured((value) => !value)}
            className={`${INSET} ${FOCUS_RING} flex min-h-touch-floor items-start gap-space-3 text-left`}
          >
            <span className={`mt-space-1 ${gpsCaptured ? "text-success-green" : "text-amber-flag"}`}>
              {gpsCaptured ? <CheckIcon /> : <AlertIcon />}
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-body text-text-primary">
                {gpsCaptured ? "Position recorded with this catch" : "No position with this catch"}
              </span>
              <span className="text-caption text-text-muted">
                Where you caught it is never shown publicly. Tap to change.
              </span>
            </span>
          </button>

          <div className="flex flex-col gap-space-2">
            <span className="text-caption text-text-muted">Event code</span>
            <div className="flex flex-wrap gap-space-2" role="group" aria-label="Event code check">
              {QR_STATES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setQrState(option.value)}
                  aria-pressed={qrState === option.value}
                  className={`${CHIP} ${qrState === option.value ? CHIP_ON : CHIP_OFF}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        {/*
          The reason a disabled primary action is disabled is stated next to it and bound to
          it with `aria-describedby` (design 04 → Button → Disabled), so a screen reader
          reaches the explanation rather than a dead control.
        */}
        <button
          type="submit"
          className={BIG_ACTION}
          disabled={species.trim().length === 0}
          aria-describedby={species.trim().length === 0 ? `${fieldId}-save-hint` : undefined}
        >
          {online ? "Save catch" : "Save on this phone"}
        </button>
        {species.trim().length === 0 ? (
          <p id={`${fieldId}-save-hint`} className="text-caption text-text-muted">
            Name the fish to save it.
          </p>
        ) : null}
      </form>

      {message ? (
        <p className={`${INSET} text-body text-text-primary`} role="status">
          {message}
        </p>
      ) : null}

      <section className="flex flex-col gap-space-3" aria-labelledby="saved-catches-heading">
        <SectionHeading aside={catches.length > 0 ? `${catches.length} on this phone` : undefined}>
          <span id="saved-catches-heading">Your catches</span>
        </SectionHeading>

        {catches.length === 0 ? (
          <EmptyState
            title="Nothing logged yet"
            body="Anything you save appears here with its evidence, whether or not you have service."
          />
        ) : (
          <ul className="flex flex-col gap-space-3">
            {catches.map((item) => (
              <CatchCard key={item.id} item={item} onQueue={() => queue(item.id)} onSync={() => sync(item.id)} />
            ))}
          </ul>
        )}
      </section>

      <p className="text-caption text-text-muted">
        Checks on a catch — a missing photo, an odd code — only ever raise a flag for a person to
        look at. Nothing here changes a score on its own.
      </p>

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}

/**
 * One saved catch: what it was, where it has got to, and what the app has to back it up.
 *
 * The `CONFLICT` state gets the most words on purpose. It is the only state where somebody
 * might reasonably fear their catch was lost or overwritten, and the honest answer — the
 * original is kept exactly as recorded, and a person decides — is the whole reason the
 * offline design works the way it does.
 */
function CatchCard({
  item,
  onQueue,
  onSync,
}: {
  item: DemoTournamentCatch;
  onQueue: () => void;
  onSync: () => void;
}) {
  const sync = syncPresentation(item.sync_state);
  const qr = qrPresentation(item.qr_state);
  const measurements = [
    item.weight_lb !== null ? `${item.weight_lb} lb` : null,
    item.length_in !== null ? `${item.length_in} in` : null,
  ].filter(Boolean);

  return (
    <li className={`${CARD} flex flex-col gap-space-4 p-space-4`}>
      <div className="flex flex-wrap items-start justify-between gap-space-3">
        <div className="flex flex-col gap-space-1">
          <p className="text-h3 text-text-primary">{item.species}</p>
          <p className={`text-body ${TABULAR} text-text-muted`}>
            {measurements.length > 0 ? measurements.join(" · ") : "No measurement recorded"}
          </p>
        </div>
        <TonePill tone={sync.tone}>{sync.label}</TonePill>
      </div>

      <p className="text-caption text-text-muted">{sync.hint}</p>

      <ul className="flex flex-wrap gap-space-2">
        <EvidenceChip ok={item.photo_name !== null} yes="Photo" no="No photo" />
        <EvidenceChip ok={item.gps_captured} yes="Position" no="No position" />
        <li>
          <TonePill tone={qr.tone}>{qr.label}</TonePill>
        </li>
        <EvidenceChip
          ok={item.server_receipt !== null}
          yes="Receipt from the scorer"
          no="No receipt yet"
        />
      </ul>

      {item.fair_play_messages.length > 0 ? (
        <div className={INSET}>
          <p className="inline-flex items-center gap-space-2 text-body-strong text-amber-flag">
            <AlertIcon />
            For a judge to look at
          </p>
          <ul className="mt-space-2 flex list-disc flex-col gap-space-1 pl-space-4 text-caption text-text-muted">
            {item.fair_play_messages.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {item.sync_state === "CONFLICT" ? (
        <p className={`${INSET} text-body text-text-primary`}>
          Your original photo and details are kept exactly as you recorded them, and so is the
          scorer&apos;s earlier copy. Nothing was overwritten — a person decides which one stands.
        </p>
      ) : null}

      {item.sync_state !== "SYNCED" ? (
        <div className="grid grid-cols-2 gap-space-2">
          <button type="button" className={SECONDARY_BUTTON} onClick={onQueue}>
            Send later
          </button>
          <button type="button" className={SECONDARY_BUTTON} onClick={onSync}>
            Send now
          </button>
        </div>
      ) : null}
    </li>
  );
}

function EvidenceChip({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  const tone = ok ? "open" : "neutral";
  const classes = TONE_CLASSES[tone];
  return (
    <li
      className={`inline-flex items-center gap-space-2 rounded-full border px-space-3 py-space-1 text-caption ${classes.pill} ${classes.text}`}
    >
      {ok ? <CheckIcon size="h-space-4 w-space-4" /> : <PendingIcon size="h-space-4 w-space-4" />}
      {ok ? yes : no}
    </li>
  );
}
