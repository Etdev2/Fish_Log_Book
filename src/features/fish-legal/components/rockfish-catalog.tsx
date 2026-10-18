import Link from "next/link";

import { SECONDARY_BUTTON } from "@/features/catches/ui-classes";
import { ROCKFISH_CATALOG } from "../rockfish-catalog";
import { hasVerifiedRules } from "../rockfish-id";
import { idPhoto } from "../species-photos";
import { SpeciesPicture } from "./species-picture";

/**
 * Every rockfish the app knows, each with its picture, A to Z.
 *
 * A browse page, not a quiz: scroll until one looks like the fish in your hand, then open
 * its rules. The no-take fish say so on the card itself, in the same amber the ID uses.
 */
export function RockfishCatalog() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Rockfish catalog</h1>
        <p className="mt-1 text-caption text-text-muted">
          {ROCKFISH_CATALOG.length} rockfish, A to Z. Scroll until one looks like your fish,
          then check its rules. California has more rockfish than this list; if yours is not
          here, use the CDFW guide and put it back if you are not sure.
        </p>
        <Link href="/fish-legal/rockfish" className={`${SECONDARY_BUTTON} mt-3 self-start`}>
          Answer questions instead
        </Link>
      </section>

      <ul className="flex flex-col gap-4">
        {ROCKFISH_CATALOG.map((fish) => (
          <li
            key={fish.speciesId}
            id={fish.speciesId}
            className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4"
          >
            <SpeciesPicture photo={idPhoto(fish.speciesId)} name={fish.commonName} />
            <div>
              <h2 className="text-h3">{fish.commonName}</h2>
              <p className="text-caption italic text-text-muted">{fish.scientificName}</p>
            </div>
            {fish.noRetention ? (
              <p className="rounded-md border border-amber-flag p-2 text-body font-semibold text-amber-flag">
                Never keep this fish. Put it back.
              </p>
            ) : null}
            {hasVerifiedRules(fish.speciesId) ? (
              <Link
                href={`/fish-legal/species/${fish.speciesId}`}
                className={`${SECONDARY_BUTTON} self-start`}
              >
                {fish.noRetention ? "Why it must go back" : "Current limits for this fish"}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
