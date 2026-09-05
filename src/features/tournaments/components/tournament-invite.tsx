"use client";

import { useState } from "react";

import { visibilityPresentation } from "../format";
import { CARD_PADDED, INSET, SECONDARY_BUTTON } from "../ui-classes";
import { CheckIcon } from "./icons";

/**
 * Getting other people into a tournament.
 *
 * What this shares is the tournament's own link, because that is the only invitation this
 * product can currently honour. A six-character join code is what a director actually
 * wants — it is what gets read out at a captains' meeting — but a code has to be minted and
 * looked up by the server, there is no column for one, and a code printed here that another
 * phone cannot resolve is a promise made to somebody standing on a dock. It is in the
 * backend ask instead.
 *
 * The visibility line under the button is the part people get wrong: sending a link to a
 * PRIVATE tournament does not let anybody in, and finding that out after the invitations
 * have gone is a bad afternoon.
 */
export function TournamentInvite({
  tournamentId,
  visibility,
}: {
  tournamentId: string;
  visibility: string;
}) {
  const [copied, setCopied] = useState(false);
  const presentation = visibilityPresentation(visibility);

  async function share() {
    const url = `${window.location.origin}/tournaments/${tournamentId}/overview`;

    // The native sheet where there is one — on a phone that is AirDrop, Messages and
    // WhatsApp, which is how a tournament actually gets shared. Clipboard otherwise.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url, title: "Fishing tournament" });
        return;
      } catch {
        // A cancelled share sheet throws. That is not a failure worth reporting, and it
        // must not fall through to silently copying something they chose not to send.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 4000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className={`${CARD_PADDED} flex flex-col gap-space-3`} aria-labelledby="invite-heading">
      <h2 id="invite-heading" className="text-h3 text-text-primary">
        Get people in
      </h2>

      <button type="button" className={SECONDARY_BUTTON} onClick={share}>
        {copied ? (
          <>
            <CheckIcon />
            Link copied
          </>
        ) : (
          "Share the tournament"
        )}
      </button>

      <p className={`${INSET} text-caption text-text-muted`}>
        <span className="text-text-primary">{presentation.label}.</span> {presentation.blurb}{" "}
        {visibility === "PRIVATE"
          ? "A link on its own will not let anybody in — you have to add them."
          : "Anyone you send this to can open it and enter while entries are open."}
      </p>
    </section>
  );
}
