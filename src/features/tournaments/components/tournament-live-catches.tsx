"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDemoTournament, hasSupabaseBrowserConfig } from "../demo-store";
import {
  getDemoTournamentCatches,
  queueDemoCatch,
  saveDemoCatch,
  syncDemoCatch,
  type DemoTournamentCatch,
} from "../live-catch-demo";
import { TOURNAMENT_CARD, TOURNAMENT_INPUT, TOURNAMENT_PRIMARY_BUTTON, TOURNAMENT_SECONDARY_BUTTON } from "../ui-classes";

type QrState = DemoTournamentCatch["qr_state"];

const QR_STATES: Array<{ value: QrState; label: string }> = [
  { value: "VALID", label: "Valid QR" },
  { value: "NOT_SCANNED", label: "Not scanned" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REUSED", label: "Reused" },
  { value: "WRONG_CONTEXT", label: "Wrong tournament" },
];

function syncLabel(value: DemoTournamentCatch["sync_state"]) {
  if (value === "SAVED_OFFLINE") return "Saved offline";
  if (value === "PENDING_SYNC") return "Pending sync";
  if (value === "SYNCED") return "Synced";
  return "Conflict — review required";
}

export function TournamentLiveCatches({ tournamentId }: { tournamentId: string }) {
  const [catches, setCatches] = useState<DemoTournamentCatch[]>([]);
  const [species, setSpecies] = useState("Yellowtail");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [gpsCaptured, setGpsCaptured] = useState(true);
  const [qrState, setQrState] = useState<QrState>("VALID");
  const [message, setMessage] = useState<string | null>(null);

  const demoMode = !hasSupabaseBrowserConfig();
  const tournament = demoMode ? getDemoTournament(tournamentId) : null;

  function refresh() {
    setCatches(getDemoTournamentCatches(tournamentId));
  }

  useEffect(() => {
    // Schedule the localStorage synchronization asynchronously so this effect does not
    // synchronously cascade a state update during the commit phase.
    void Promise.resolve().then(() => {
      setCatches(getDemoTournamentCatches(tournamentId));
    });
  }, [tournamentId]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!demoMode) {
      setMessage("Live Supabase catch sync is not enabled in this UI lane yet. The local-first capture contract is ready for backend wiring.");
      return;
    }

    const item = saveDemoCatch({
      tournamentId,
      species,
      weightLb: weight ? Number(weight) : null,
      lengthIn: length ? Number(length) : null,
      photoName,
      gpsCaptured,
      qrState,
    });
    setMessage(`Catch ${item.id.slice(-6)} preserved on this device. You can sync it when service returns.`);
    setWeight("");
    setLength("");
    setPhotoName(null);
    refresh();
  }

  function queue(id: string) {
    queueDemoCatch(id);
    setMessage("Catch queued without changing its original evidence.");
    refresh();
  }

  function sync(id: string) {
    syncDemoCatch(id);
    setMessage("Sync attempted. Exact retries reuse the same client mutation id instead of creating a duplicate.");
    refresh();
  }

  if (demoMode && !tournament) {
    return (
      <div className="mx-auto flex max-w-reading flex-col gap-space-4 px-space-4 py-space-5">
        <p className={`${TOURNAMENT_CARD} text-body text-error-red`}>Tournament not found on this device.</p>
        <Link href="/tournaments" className={TOURNAMENT_SECONDARY_BUTTON}>Back to tournaments</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-5 px-space-4 py-space-5">
      <header className="flex flex-col gap-space-2">
        <Link href={`/tournaments/${tournamentId}/overview`} className="text-caption text-text-link">← Overview</Link>
        <div className="flex flex-wrap items-start justify-between gap-space-3">
          <div>
            <h1 className="text-h1 text-text-primary">Live catches</h1>
            <p className="text-body text-text-muted">Record first. Sync second. Original evidence stays preserved.</p>
          </div>
          {demoMode ? <span className="rounded-full border border-hairline px-space-3 py-space-1 text-caption text-text-muted">Demo mode</span> : null}
        </div>
      </header>

      <section className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`}>
        <div className="flex items-start justify-between gap-space-3">
          <div>
            <h2 className="text-h3 text-text-primary">Catch session</h2>
            <p className="text-caption text-text-muted">QR and evidence checks surface warnings only. They never silently change a score.</p>
          </div>
          <span className="text-caption text-text-muted">{navigator.onLine ? "Online" : "Offline"}</span>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-space-4">
          <label className="flex flex-col gap-space-2">
            <span className="text-label text-text-primary">Species</span>
            <input required value={species} onChange={(event) => setSpecies(event.target.value)} className={TOURNAMENT_INPUT} placeholder="Yellowtail" />
          </label>

          <div className="grid grid-cols-2 gap-space-3">
            <label className="flex flex-col gap-space-2">
              <span className="text-label text-text-primary">Weight (lb)</span>
              <input inputMode="decimal" type="number" min="0" step="0.01" value={weight} onChange={(event) => setWeight(event.target.value)} className={TOURNAMENT_INPUT} placeholder="18.4" />
            </label>
            <label className="flex flex-col gap-space-2">
              <span className="text-label text-text-primary">Length (in)</span>
              <input inputMode="decimal" type="number" min="0" step="0.1" value={length} onChange={(event) => setLength(event.target.value)} className={TOURNAMENT_INPUT} placeholder="34.5" />
            </label>
          </div>

          <label className="flex flex-col gap-space-2">
            <span className="text-label text-text-primary">Catch photo</span>
            <input type="file" accept="image/*" capture="environment" onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? null)} className="min-h-touch-floor text-body text-text-primary" />
            <span className="text-caption text-text-muted">In demo mode only the file name is stored; real evidence bytes remain a backend responsibility.</span>
          </label>

          <label className="flex min-h-touch-floor items-center gap-space-3 text-body text-text-primary">
            <input type="checkbox" checked={gpsCaptured} onChange={(event) => setGpsCaptured(event.target.checked)} />
            GPS captured with this catch
          </label>

          <fieldset className="flex flex-col gap-space-2">
            <legend className="text-label text-text-primary">QR check</legend>
            <div className="grid grid-cols-2 gap-space-2">
              {QR_STATES.map((option) => (
                <button key={option.value} type="button" onClick={() => setQrState(option.value)} aria-pressed={qrState === option.value} className={qrState === option.value ? TOURNAMENT_PRIMARY_BUTTON : TOURNAMENT_SECONDARY_BUTTON}>
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <button type="submit" disabled={species.trim().length === 0} className={TOURNAMENT_PRIMARY_BUTTON}>
            Save catch
          </button>
        </form>
      </section>

      {message ? <p className={`${TOURNAMENT_CARD} text-caption text-text-muted`} role="status">{message}</p> : null}

      <section className="flex flex-col gap-space-3" aria-labelledby="saved-catches-heading">
        <div className="flex items-center justify-between gap-space-3">
          <h2 id="saved-catches-heading" className="text-h3 text-text-primary">Saved catches</h2>
          <span className="text-caption text-text-muted">{catches.length} on device</span>
        </div>

        {catches.length === 0 ? (
          <p className={`${TOURNAMENT_CARD} text-body text-text-muted`}>No tournament catches recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-space-3">
            {catches.map((item) => (
              <li key={item.id} className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`}>
                <div className="flex items-start justify-between gap-space-3">
                  <div>
                    <p className="text-body-strong text-text-primary">{item.species}</p>
                    <p className="text-caption text-text-muted">
                      {item.weight_lb !== null ? `${item.weight_lb} lb` : "No weight"} · {item.length_in !== null ? `${item.length_in} in` : "No length"}
                    </p>
                  </div>
                  <span className="rounded-full border border-hairline px-space-2 py-space-1 text-caption text-text-muted">{syncLabel(item.sync_state)}</span>
                </div>

                <dl className="grid grid-cols-2 gap-space-2 text-caption">
                  <div><dt className="text-text-muted">Photo</dt><dd className="text-text-primary">{item.photo_name ?? "Missing"}</dd></div>
                  <div><dt className="text-text-muted">GPS</dt><dd className="text-text-primary">{item.gps_captured ? "Captured" : "Missing"}</dd></div>
                  <div><dt className="text-text-muted">QR</dt><dd className="text-text-primary">{item.qr_state.toLowerCase().replaceAll("_", " ")}</dd></div>
                  <div><dt className="text-text-muted">Receipt</dt><dd className="text-text-primary">{item.server_receipt ? "Preserved" : "Not received"}</dd></div>
                </dl>

                {item.fair_play_messages.length > 0 ? (
                  <div className="rounded-lg border border-hairline bg-surface-muted p-space-3">
                    <p className="text-body-strong text-text-primary">Fair Play review</p>
                    <ul className="mt-space-2 flex list-disc flex-col gap-space-1 pl-space-4 text-caption text-text-muted">
                      {item.fair_play_messages.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="text-caption text-text-muted">No Fair Play warnings detected in this local capture.</p>
                )}

                <div className="grid grid-cols-2 gap-space-2">
                  <button type="button" className={TOURNAMENT_SECONDARY_BUTTON} onClick={() => queue(item.id)}>Queue sync</button>
                  <button type="button" className={TOURNAMENT_PRIMARY_BUTTON} onClick={() => sync(item.id)}>Sync now</button>
                </div>

                {item.sync_state === "CONFLICT" ? (
                  <p className="text-caption text-error-red">Conflict detected. The original evidence and prior server receipt are preserved; a human must decide how to reconcile it.</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
