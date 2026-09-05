export type DemoCatchSyncState = "SAVED_OFFLINE" | "PENDING_SYNC" | "SYNCED" | "CONFLICT";

export type DemoTournamentCatch = {
  id: string;
  tournament_id: string;
  client_mutation_id: string;
  species: string;
  weight_lb: number | null;
  length_in: number | null;
  captured_at: string;
  photo_name: string | null;
  gps_captured: boolean;
  qr_state: "VALID" | "EXPIRED" | "REUSED" | "WRONG_CONTEXT" | "NOT_SCANNED";
  sync_state: DemoCatchSyncState;
  original_payload: string;
  server_receipt: string | null;
  fair_play_messages: string[];
};

const KEY = "fish-log-book:demo-tournament-catches";

function read(): DemoTournamentCatch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as DemoTournamentCatch[];
  } catch {
    return [];
  }
}

function write(items: DemoTournamentCatch[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

function payloadOf(input: Pick<DemoTournamentCatch, "species" | "weight_lb" | "length_in" | "captured_at" | "photo_name" | "gps_captured" | "qr_state">) {
  return JSON.stringify(input);
}

export function getDemoTournamentCatches(tournamentId: string) {
  return read().filter((item) => item.tournament_id === tournamentId);
}

export function saveDemoCatch(input: {
  tournamentId: string;
  species: string;
  weightLb: number | null;
  lengthIn: number | null;
  photoName: string | null;
  gpsCaptured: boolean;
  qrState: DemoTournamentCatch["qr_state"];
}) {
  const capturedAt = new Date().toISOString();
  const id = `demo-catch-${Date.now()}`;
  const clientMutationId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const fairPlayMessages: string[] = [];

  if (!input.photoName) fairPlayMessages.push("Photo evidence is missing. A judge may need to review this catch.");
  if (!input.gpsCaptured) fairPlayMessages.push("GPS evidence is unavailable. This does not change the score automatically.");
  if (input.qrState === "EXPIRED") fairPlayMessages.push("QR token expired before submission. Human review may be required.");
  if (input.qrState === "REUSED") fairPlayMessages.push("This QR token appears to have been reused. The catch remains preserved for review.");
  if (input.qrState === "WRONG_CONTEXT") fairPlayMessages.push("The QR token does not match this tournament context.");

  const payload = {
    species: input.species.trim(),
    weight_lb: input.weightLb,
    length_in: input.lengthIn,
    captured_at: capturedAt,
    photo_name: input.photoName,
    gps_captured: input.gpsCaptured,
    qr_state: input.qrState,
  };

  const item: DemoTournamentCatch = {
    id,
    tournament_id: input.tournamentId,
    client_mutation_id: clientMutationId,
    ...payload,
    sync_state: "SAVED_OFFLINE",
    original_payload: payloadOf(payload),
    server_receipt: null,
    fair_play_messages: fairPlayMessages,
  };

  write([item, ...read()]);
  return item;
}

export function queueDemoCatch(catchId: string) {
  const items = read().map((item) => item.id === catchId ? { ...item, sync_state: "PENDING_SYNC" as const } : item);
  write(items);
}

export function syncDemoCatch(catchId: string) {
  const items = read();
  const next = items.map((item) => {
    if (item.id !== catchId) return item;
    const currentPayload = payloadOf(item);
    if (item.server_receipt && currentPayload !== item.original_payload) {
      return { ...item, sync_state: "CONFLICT" as const };
    }
    return {
      ...item,
      sync_state: "SYNCED" as const,
      server_receipt: item.server_receipt ?? `demo-receipt-${item.client_mutation_id}`,
    };
  });
  write(next);
}
