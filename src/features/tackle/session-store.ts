"use client";

import { useSyncExternalStore } from "react";

import { TACKLE_FIXTURE } from "./tackle-fixture";
import {
  clampQuantity,
  rememberValue,
  type RecentsMap,
  type TackleDraft,
  type TackleItem,
} from "./types";

/**
 * The tackle inventory is a session-only prototype (docs/design/08-tackle-box.md):
 * one module-level store shared by the Tackle Box page and every category page, so
 * edits made on /tackle/hooks are still there when you go back to /tackle — and
 * everything still honestly resets on refresh. When the offline store lane lands,
 * this module is the single swap point.
 */

export type TackleSession = {
  items: readonly TackleItem[];
  recents: RecentsMap;
  lastDraft: TackleDraft | null;
};

const initialSession: TackleSession = {
  items: [...TACKLE_FIXTURE],
  recents: {},
  lastDraft: null,
};

let session: TackleSession = initialSession;
const listeners = new Set<() => void>();

function setSession(next: TackleSession) {
  session = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): TackleSession {
  return session;
}

/** During SSR/hydration both branches must render the untouched initial session. */
function getServerSnapshot(): TackleSession {
  return initialSession;
}

export function useTackleSession(): TackleSession {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// --- Mutations -------------------------------------------------------------------------------

export function saveTackleItem(draft: TackleDraft, id?: string): void {
  setSession({
    ...session,
    items: id
      ? session.items.map((item) => (item.id === id ? { ...draft, id, addedAt: item.addedAt } : item))
      : [{ ...draft, id: `session-${crypto.randomUUID()}`, addedAt: Date.now() }, ...session.items],
    recents: Object.entries(draft.attributes).reduce(
      (recents, [fieldKey, value]) => rememberValue(recents, `${draft.category}:${fieldKey}`, value),
      session.recents,
    ),
    lastDraft: draft,
  });
}

export function deleteTackleItem(id: string): void {
  setSession({ ...session, items: session.items.filter((item) => item.id !== id) });
}

export function toggleTackleFavorite(id: string): void {
  setSession({
    ...session,
    items: session.items.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item,
    ),
  });
}

export function adjustTackleQuantity(id: string, next: number): void {
  setSession({
    ...session,
    items: session.items.map((item) =>
      item.id === id ? { ...item, quantity: clampQuantity(next) } : item,
    ),
  });
}
