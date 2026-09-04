import Link from "next/link";

import { LegalNotice } from "@/components/legal-notice";
import { FISH_ID_PACKS } from "../packs";

/**
 * Fish ID — the hub (spec §17).
 *
 * Packs are listed rather than merged into one giant questionnaire, because the questions
 * that separate salmon are not the questions that separate sand bass, and a single form
 * asking both would be longer and worse. Rockfish keeps its own screen for now; it has
 * bespoke colour swatches and a direct line into the SoCal regulation pack that are worth
 * more than the consistency of folding it in.
 */
const FOCUS =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

export function FishIdHome() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Fish ID</h1>
        <p className="mt-1 text-body text-text-muted">
          For the fish that are genuinely hard to tell apart — where getting it wrong means
          a citation or a protected fish in the box.
        </p>
        <div className="mt-3">
          <LegalNotice kind="identification" />
        </div>
      </section>

      <ul className="flex flex-col gap-3">
        {FISH_ID_PACKS.map(({ pack, blurb }) => (
          <li key={pack.id}>
            <Link
              href={`/fish-id/${pack.id}`}
              className={`flex min-h-touch-floor flex-col gap-1 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:bg-surface-raised ${FOCUS}`}
            >
              <span className="text-body-strong text-text-primary">{pack.name}</span>
              <span className="text-caption text-text-muted">{blurb}</span>
              <span className="text-caption text-text-muted">
                {pack.profiles.length} species · {pack.questions.length} questions
              </span>
            </Link>
          </li>
        ))}

        <li>
          <Link
            href="/fish-legal/rockfish"
            className={`flex min-h-touch-floor flex-col gap-1 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:bg-surface-raised ${FOCUS}`}
          >
            <span className="text-body-strong text-text-primary">Rockfish</span>
            <span className="text-caption text-text-muted">
              The SoCal complex, with the two you may not keep flagged early.
            </span>
          </Link>
        </li>

        <li>
          <Link
            href="/fin-id"
            className={`flex min-h-touch-floor flex-col gap-1 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:bg-surface-raised ${FOCUS}`}
          >
            <span className="text-body-strong text-text-primary">Whales &amp; dolphins</span>
            <span className="text-caption text-text-muted">
              Not a fish, and never a catch — what surfaced, and how far back to stay.
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
