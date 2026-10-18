import { pictureCredits, type SpeciesPhoto } from "../species-photos";

/**
 * A species' picture, big enough to hold up next to the fish in your hand.
 *
 * Founder, 2026-10-18: "wherever there is a fish that is named, I want the picture of
 * that fish". The bundled images are mostly CDFW's identification drawings on white, so
 * they sit on a white mat and are shown whole (`object-contain`): cropping a fin off is
 * cropping off the thing you were meant to compare.
 *
 * No photo means the placeholder, never a look-alike. A wrong picture is worse than none.
 */
export function SpeciesPicture({
  photo,
  name,
}: {
  photo: SpeciesPhoto | null;
  name: string;
}) {
  if (photo === null) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed border-hairline bg-background p-3 text-center text-caption text-text-muted">
        No checked picture of the {name.toLowerCase()} yet. Compare with the state agency
        guide before you keep it.
      </div>
    );
  }
  return (
    <figure className="flex flex-col gap-1">
      <span className="block overflow-hidden rounded-md bg-photo-mat">
        {/* eslint-disable-next-line @next/next/no-img-element -- bundled local asset, offline-first */}
        <img
          src={photo.src}
          alt={`Picture of a ${name.toLowerCase()}`}
          className="aspect-video w-full object-contain"
          width={900}
          height={489}
          loading="lazy"
        />
      </span>
      <figcaption className="text-caption text-text-muted">{photo.credit}</figcaption>
    </figure>
  );
}

/**
 * A list-row thumbnail. Credit is not shown per row (there is no room at 320px); a list
 * that uses this must show `PictureCredits` for the pictures it drew.
 *
 * With no checked picture the slot is an empty frame, so names still line up.
 */
export function SpeciesThumb({ photo }: { photo: SpeciesPhoto | null }) {
  if (photo === null) {
    return (
      <span
        aria-hidden
        className="block aspect-video w-20 shrink-0 rounded border border-dashed border-hairline"
      />
    );
  }
  return (
    <span className="block w-20 shrink-0 overflow-hidden rounded bg-photo-mat">
      {/* eslint-disable-next-line @next/next/no-img-element -- bundled local asset, offline-first */}
      <img
        src={photo.src}
        alt=""
        className="aspect-video w-full object-contain"
        width={160}
        height={87}
        loading="lazy"
      />
    </span>
  );
}

/** The attribution line for every picture a list showed, each credit once. */
export function PictureCredits({ photos }: { photos: readonly (SpeciesPhoto | null)[] }) {
  const credits = pictureCredits(photos);
  if (credits.length === 0) return null;
  return (
    <p className="text-caption text-text-muted">Pictures: {credits.join("; ")}.</p>
  );
}
