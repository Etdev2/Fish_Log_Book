/**
 * Drawings of the thing a Fin ID / Fish ID question is asking about.
 *
 * **The salmon figures are full-colour pictures (founder, 2026-10-16).** Shown the old
 * 48×32 line glyphs on a phone, the founder's bar was "a five-year-old understands it".
 * A grey outline of a tail with three dots did not pass: you had to already know what a
 * "lobe" was to read it. Those figures are now drawn like the fish in your hands — dark
 * back, silver side, pale belly, black spots where the spots really are — and shown as big
 * picture cards. They are still drawings, not photos, for every reason below, and their
 * colours are illustration tokens (`fish-*` in tokens.json), so ADR 005 §2 still holds.
 * The other packs keep their line figures until they get the same treatment.
 *
 * **Drawn, not photographed, and that is the better answer here.** The founder asked for
 * photos beside the questions. A photograph of a tail carries water, glare, an angle and a
 * hand; a drawing carries only the thing being asked about. For "spots on both lobes or
 * just the upper one" the diagram is not the cheap substitute, it is the clearer one — and
 * it also avoids reopening the image-licensing debt that `species-photos.ts` already
 * carries and that photos were cut over.
 *
 * These figures explain a single feature (a spike, a gum line). Whole-fish pictures are a
 * separate thing: the candidate cards show the checked agency drawings from
 * `species-photos.ts`, never a schematic pretending to be the fish in your hands.
 *
 * Everything is stroked in `currentColor`, so a figure inherits its button's text colour
 * and is legible selected or not, in either theme, with no colour literal in sight — which
 * is also what keeps the ADR 005 §2 tripwire happy.
 */

export type TraitFigureKey =
  // Salmon: the tail-spot and gum-line key, which is the whole decision.
  | "tail-spots-both"
  | "tail-spots-upper"
  | "tail-spots-whole"
  | "tail-spots-none"
  | "gums-black"
  | "gums-white"
  | "mouth-black"
  | "mouth-white"
  // Sand bass: the third-dorsal-spine tell, and the body patterns.
  | "spines-even"
  | "spine-third-long"
  | "body-blotches"
  | "body-bars"
  | "body-spots"
  | "body-plain"
  // Cetaceans: the blow and the fin, read at a hundred yards.
  | "blow-tall"
  | "blow-bushy"
  | "blow-v"
  | "blow-low"
  | "blow-none"
  | "fin-none"
  | "fin-hump"
  | "fin-small-back"
  | "fin-tall-hooked"
  | "fin-tall-straight"
  | "fin-curved"
  | "fin-triangle";

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/*
 * Realistic figures share one 120×80 canvas. Every colour is a `fish-*` token class, so no
 * literal appears here. Tokens are illustration-only: never text, never chrome.
 */
const OUTLINE = { fill: "none", strokeWidth: 0.9, strokeLinejoin: "round", className: "stroke-fish-back" } as const;

type Spot = readonly [cx: number, cy: number];
const BACK_SPOTS: readonly Spot[] = [[10, 21], [21, 24], [33, 27], [15, 29], [43, 31]];
const UPPER_LOBE_SPOTS: readonly Spot[] = [[66, 29], [75, 24], [84, 20], [93, 15], [102, 10], [80, 28], [90, 23], [100, 17]];
const LOWER_LOBE_SPOTS: readonly Spot[] = [[66, 51], [75, 56], [84, 60], [93, 65], [102, 70], [80, 52], [90, 57], [100, 63]];
const BIG_OVAL_SPOTS: readonly Spot[] = [[68, 33], [82, 26], [98, 16], [68, 48], [82, 55], [98, 65], [88, 40], [12, 25], [27, 29], [41, 34], [20, 40], [36, 44]];

/**
 * The back third of a salmon seen from the side: tapering body, then the forked tail.
 * Spots are drawn exactly where the question says they are, and nowhere else.
 */
function Tail({ spots }: { spots: "both" | "upper" | "whole" | "none" }) {
  const small: readonly Spot[] =
    spots === "both"
      ? [...BACK_SPOTS, ...UPPER_LOBE_SPOTS, ...LOWER_LOBE_SPOTS]
      : spots === "upper"
        ? [...BACK_SPOTS, ...UPPER_LOBE_SPOTS]
        : [];
  const body = "M0 12 C 25 16, 45 26, 56 31 L 56 49 C 45 54, 25 64, 0 68 Z";
  const fin = "M54 31 C 70 22, 92 10, 117 3 C 108 18, 100 30, 96 40 C 100 50, 108 62, 117 77 C 92 70, 70 58, 54 49 Z";
  return (
    <>
      <path d={fin} className="fill-fish-fin" />
      {/* fin rays, fanning from the wrist */}
      {[8, 18, 28, 52, 62, 72].map((y) => (
        <path key={y} d={`M57 40 L ${y < 40 ? 104 - y / 3 : 104 - (80 - y) / 3} ${y}`} className="stroke-fish-back" strokeWidth="0.6" opacity="0.5" />
      ))}
      <path d={fin} {...OUTLINE} />
      <path d={body} className="fill-fish-side" />
      <path d="M0 12 C 25 16, 45 26, 56 31 L 56 37 C 42 34, 22 29, 0 31 Z" className="fill-fish-back" />
      <path d="M0 55 C 22 54, 42 49, 56 46 L 56 49 C 45 54, 25 64, 0 68 Z" className="fill-fish-belly" />
      <path d="M0 43 C 20 42, 40 41, 56 40" className="stroke-fish-back" strokeWidth="0.7" fill="none" opacity="0.6" />
      <path d={body} {...OUTLINE} />
      {small.map(([cx, cy]) => (
        <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="2.3" ry="1.7" className="fill-fish-spot" />
      ))}
      {spots === "whole"
        ? BIG_OVAL_SPOTS.map(([cx, cy]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="5" ry="3.2" className="fill-fish-spot" />
          ))
        : null}
    </>
  );
}

/**
 * A salmon's head from the side with the mouth open. Two questions are asked of it, so
 * the colour under test changes and everything else stays put:
 * - "gums": the band along the lower jaw where the teeth sit is black or white.
 * - "mouth": the inside of the mouth is black or pale.
 */
function Head({ gums, inside }: { gums: "dark" | "pale" | "plain"; inside: "dark" | "pale" | "plain" }) {
  const insideClass = inside === "dark" ? "fill-fish-spot" : inside === "pale" ? "fill-fish-gum-pale" : "fill-fish-mouth-flesh";
  const gumClass = gums === "dark" ? "fill-fish-gum-dark" : gums === "pale" ? "fill-fish-gum-pale" : "fill-fish-mouth-flesh";
  const gumBand = "M8 38 C 40 46, 80 50, 120 52 L 120 59 C 80 57, 40 52, 10 44 Z";
  return (
    <>
      {/* inside of the mouth, seen between the open jaws */}
      <path d="M4 31 C 40 28, 80 29, 120 32 L 120 53 C 80 51, 40 47, 8 38 Z" className={insideClass} />
      {/* upper jaw and head */}
      <path d="M120 2 C 84 0, 42 9, 4 30 C 30 31, 70 28, 120 32 Z" className="fill-fish-side" />
      <path d="M120 2 C 84 0, 42 9, 4 30 C 40 17, 80 12, 120 13 Z" className="fill-fish-back" />
      <path d="M120 2 C 84 0, 42 9, 4 30 C 30 31, 70 28, 120 32" {...OUTLINE} />
      {/* top teeth */}
      {[20, 34, 48, 62, 76, 90, 104].map((x) => (
        <path key={x} d={`M${x} ${30 - x / 60} l 2.5 4.5 l 2.5 -4.5 Z`} className="fill-fish-belly stroke-fish-back" strokeWidth="0.4" />
      ))}
      {/* eye */}
      <circle cx="96" cy="17" r="6" className="fill-fish-eye-ring" />
      <circle cx="96" cy="17" r="3.6" className="fill-fish-eye" />
      {/* lower jaw, dropped open */}
      <path d="M10 44 C 40 52, 80 57, 120 59 L 120 78 C 80 76, 40 64, 12 47 Z" className="fill-fish-belly" />
      <path d={gumBand} className={gumClass} />
      <path d={gumBand} {...OUTLINE} />
      {/* bottom teeth, standing in the gum line */}
      {[22, 36, 50, 64, 78, 92, 106].map((x) => (
        <path key={x} d={`M${x} ${41 + x / 10} l 2.5 -5 l 2.5 5 Z`} className="fill-fish-belly stroke-fish-back" strokeWidth="0.4" />
      ))}
      <path d="M10 44 C 40 52, 80 57, 120 59 L 120 78 C 80 76, 40 64, 12 47" {...OUTLINE} />
    </>
  );
}

/** The line-drawn figures, unchanged, for packs that have not been redrawn yet. */
/** The spiny dorsal, with one spine optionally standing well above its neighbours. */
function Spines({ thirdLong }: { thirdLong: boolean }) {
  const heights = thirdLong ? [20, 17, 6, 15, 14, 15] : [16, 14, 13, 14, 13, 14];
  return (
    <>
      <path d="M4 30 C 16 26, 32 26, 44 30" {...STROKE} />
      {heights.map((top, i) => {
        const x = 8 + i * 6;
        return <path key={x} d={`M${x} 28 L ${x + 2.5} ${top}`} {...STROKE} />;
      })}
      <path d={`M10.5 ${heights[0]} L ${8 + 5 * 6 + 2.5} ${heights[5]}`} stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
    </>
  );
}

/** A body outline carrying one of the four patterns the bass questions ask about. */
function Body({ pattern }: { pattern: "blotches" | "bars" | "spots" | "plain" }) {
  return (
    <>
      <path d="M4 18 C 12 8, 30 8, 40 18 C 30 28, 12 28, 4 18 Z" {...STROKE} />
      {pattern === "bars"
        ? [14, 20, 26, 32].map((x) => (
            <path key={x} d={`M${x} 11 L ${x - 1} 25`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ))
        : null}
      {pattern === "spots"
        ? [
            [13, 15],
            [20, 21],
            [27, 14],
            [33, 20],
          ].map(([cx, cy]) => <circle key={`${cx}`} cx={cx} cy={cy} r="1.9" fill="currentColor" />)
        : null}
      {pattern === "blotches"
        ? [
            [15, 16],
            [26, 20],
            [33, 15],
          ].map(([cx, cy]) => <ellipse key={`${cx}`} cx={cx} cy={cy} rx="4.5" ry="3" fill="currentColor" opacity="0.55" />)
        : null}
    </>
  );
}

/** Waterline plus a blow, for the whale questions. */
function Blow({ shape }: { shape: "tall" | "bushy" | "v" | "low" | "none" }) {
  return (
    <>
      <path d="M2 28 C 12 26, 20 30, 30 28 C 36 27, 40 28, 46 27" {...STROKE} />
      <path d="M14 28 C 18 24, 28 24, 33 28" {...STROKE} />
      {shape === "tall" ? <path d="M23 24 L 23 4" {...STROKE} /> : null}
      {shape === "bushy" ? (
        <>
          <path d="M23 24 C 20 16, 20 12, 22 8" {...STROKE} />
          <path d="M23 24 C 26 16, 26 12, 24 8" {...STROKE} />
          <circle cx="23" cy="7" r="3.6" {...STROKE} />
        </>
      ) : null}
      {shape === "v" ? (
        <>
          <path d="M23 24 L 16 6" {...STROKE} />
          <path d="M23 24 L 30 6" {...STROKE} />
        </>
      ) : null}
      {shape === "low" ? <path d="M23 24 C 18 20, 28 20, 23 24 M 16 20 C 23 14, 23 14, 30 20" {...STROKE} /> : null}
      {shape === "none" ? <path d="M18 12 L 28 22 M 28 12 L 18 22" {...STROKE} opacity="0.5" /> : null}
    </>
  );
}

/** A back breaking the surface, carrying the fin shape the question describes. */
function Fin({ shape }: { shape: "none" | "hump" | "small-back" | "tall-hooked" | "tall-straight" | "curved" | "triangle" }) {
  const back = "M2 26 C 14 20, 34 20, 46 26";
  return (
    <>
      <path d={back} {...STROKE} />
      {shape === "none" ? null : null}
      {shape === "hump" ? <path d="M22 21 C 25 18, 28 18, 31 21 M 33 21 l 2 -1 M 37 22 l 2 -1" {...STROKE} /> : null}
      {shape === "small-back" ? <path d="M32 21 C 33 17, 35 17, 36 21" {...STROKE} /> : null}
      {shape === "tall-hooked" ? <path d="M28 21 C 29 10, 33 8, 36 12 C 34 12, 32 15, 32 21" {...STROKE} /> : null}
      {shape === "tall-straight" ? <path d="M22 21 L 23 4 L 27 4 L 27 21" {...STROKE} /> : null}
      {shape === "curved" ? <path d="M20 21 C 22 12, 28 10, 30 21" {...STROKE} /> : null}
      {shape === "triangle" ? <path d="M22 21 L 25 14 L 28 21 Z" {...STROKE} /> : null}
    </>
  );
}

/** Full-colour figures on the 120×80 canvas. */
const PICTURES: Partial<Record<TraitFigureKey, React.ReactNode>> = {
  "tail-spots-both": <Tail spots="both" />,
  "tail-spots-upper": <Tail spots="upper" />,
  "tail-spots-whole": <Tail spots="whole" />,
  "tail-spots-none": <Tail spots="none" />,
  "gums-black": <Head gums="dark" inside="plain" />,
  "gums-white": <Head gums="pale" inside="plain" />,
  "mouth-black": <Head gums="plain" inside="dark" />,
  "mouth-white": <Head gums="plain" inside="pale" />,
};

/** Line figures on the 48×32 canvas, stroked in currentColor. */
const FIGURES: Partial<Record<TraitFigureKey, React.ReactNode>> = {
  "spines-even": <Spines thirdLong={false} />,
  "spine-third-long": <Spines thirdLong />,
  "body-blotches": <Body pattern="blotches" />,
  "body-bars": <Body pattern="bars" />,
  "body-spots": <Body pattern="spots" />,
  "body-plain": <Body pattern="plain" />,
  "blow-tall": <Blow shape="tall" />,
  "blow-bushy": <Blow shape="bushy" />,
  "blow-v": <Blow shape="v" />,
  "blow-low": <Blow shape="low" />,
  "blow-none": <Blow shape="none" />,
  "fin-none": <Fin shape="none" />,
  "fin-hump": <Fin shape="hump" />,
  "fin-small-back": <Fin shape="small-back" />,
  "fin-tall-hooked": <Fin shape="tall-hooked" />,
  "fin-tall-straight": <Fin shape="tall-straight" />,
  "fin-curved": <Fin shape="curved" />,
  "fin-triangle": <Fin shape="triangle" />,
};

/** True when this figure is a full-colour picture and should be shown as a picture card. */
export function isPicture(figure: TraitFigureKey): boolean {
  return figure in PICTURES;
}

/**
 * `aria-hidden` throughout: the option's own label already says what this shows, and a
 * screen reader announcing "diagram of a tail" after "spots on both lobes" is noise.
 *
 * `size="card"` fills its container's width; `size="chip"` is the small inline glyph.
 */
export function TraitFigure({ figure, size = "chip" }: { figure: TraitFigureKey; size?: "chip" | "card" }) {
  const picture = PICTURES[figure];
  if (picture !== undefined) {
    return (
      <svg viewBox="0 0 120 80" aria-hidden className={size === "card" ? "h-auto w-full" : "h-8 w-12 shrink-0"}>
        {picture}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 32" aria-hidden className={size === "card" ? "h-auto w-full" : "h-8 w-12 shrink-0"}>
      {FIGURES[figure]}
    </svg>
  );
}
