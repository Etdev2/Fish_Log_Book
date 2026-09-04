"use client";

import { LEGAL_VERSION } from "@/core/legal/documents";
import { createLocalPreference } from "@/features/settings/preference";

/**
 * Whether this device has acknowledged the current terms and fishing-rules notice.
 *
 * Stored as the acknowledged version string rather than a boolean, so a substantive
 * change to the documents (which bumps `LEGAL_VERSION`) asks again instead of silently
 * inheriting consent given to different words.
 *
 * localStorage, not the account: the app is fully usable signed out, so consent has to
 * be recordable signed out too.
 */
export const legalAcknowledgement = createLocalPreference<string | null>({
  key: "flb:legal-acknowledged",
  defaultValue: null,
  parse: (raw) => (raw && raw.length > 0 ? raw : null),
  serialize: (value) => value ?? "",
});

/**
 * Read it inside a component through this, never as `legalAcknowledgement.use()`.
 *
 * React Compiler is on (`next.config.ts`), and it identifies hooks by name. A member
 * call is not a name it recognises, so a component calling `.use()` directly gets
 * memoized as if it had no reactive dependency and never re-renders when the store
 * catches up with localStorage — the card would ask every single visit, forever.
 * This cost an hour; every other preference in the app wraps `.use()` the same way.
 */
export function useLegalAcknowledgement() {
  return legalAcknowledgement.use();
}

export function acceptCurrentLegal(): void {
  legalAcknowledgement.set(LEGAL_VERSION);
}
