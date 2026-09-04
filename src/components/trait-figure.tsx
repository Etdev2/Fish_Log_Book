/**
 * Little drawings of the thing a Fin ID / Fish ID question is asking about.
 *
 * **Drawn, not photographed, and that is the better answer here.** The founder asked for
 * photos beside the questions. A photograph of a tail carries water, glare, an angle and a
 * hand; a drawing carries only the thing being asked about. For "spots on both lobes or
 * just the upper one" the diagram is not the cheap substitute, it is the clearer one — and
 * it also avoids reopening the image-licensing debt that `species-photos.ts` already
 * carries and that photos were cut over.
 *
 * This is the same stance the rockfish wizard's colour swatch already took: an honest
 * schematic rather than a picture pretending to be the fish in your hands.
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

/** A caudal fin, forked, drawn from the side. Spots are added per variant. */
function Tail({ spots }: { spots: "both" | "upper" | "whole" | "none" }) {
  const upper = [
    [30, 10],
    [37, 8],
    [33, 14],
  ] as const;
  const lower = [
    [30, 26],
    [37, 28],
    [33, 22],
  ] as const;
  const show =
    spots === "both" ? [...upper, ...lower] : spots === "upper" ? upper : spots === "whole" ? [...upper, ...lower, [26, 18] as const] : [];

  return (
    <>
      {/* wrist and the two lobes */}
      <path d="M8 18 C 16 15, 22 15, 26 18 C 22 21, 16 21, 8 18 Z" {...STROKE} />
      <path d="M26 18 L 42 4 L 38 18 L 42 32 Z" {...STROKE} />
      {show.map(([cx, cy], i) => (
        <circle key={`${cx}-${cy}-${i}`} cx={cx} cy={cy} r={spots === "whole" ? 2.2 : 1.7} fill="currentColor" />
      ))}
    </>
  );
}

/**
 * A head in profile with the mouth open, so the gum line is the thing you look at.
 *
 * The two variants differ by FILL, not by line weight: solid reads as black gums, hollow
 * as white. An earlier version varied the stroke width and the two were indistinguishable
 * at chip size, which defeats the point of drawing them at all.
 */
function Gums({ dark }: { dark: boolean }) {
  // The gum band itself: a crescent hugging the underside of the upper jaw.
  const band = "M11 15 C 19 12, 29 11, 39 13 L 39 16 C 29 14, 19 15, 11 18 Z";
  return (
    <>
      {/* upper jaw and skull */}
      <path d="M6 15 C 10 6, 26 4, 42 10" {...STROKE} />
      {/* lower jaw, dropped open */}
      <path d="M7 18 C 14 26, 28 28, 42 24" {...STROKE} />
      {/* snout */}
      <path d="M6 15 L 7 18" {...STROKE} />
      {dark ? (
        <path d={band} fill="currentColor" />
      ) : (
        <path d={band} fill="none" stroke="currentColor" strokeWidth="1.2" />
      )}
    </>
  );
}

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

const FIGURES: Record<TraitFigureKey, React.ReactNode> = {
  "tail-spots-both": <Tail spots="both" />,
  "tail-spots-upper": <Tail spots="upper" />,
  "tail-spots-whole": <Tail spots="whole" />,
  "tail-spots-none": <Tail spots="none" />,
  "gums-black": <Gums dark />,
  "gums-white": <Gums dark={false} />,
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

/**
 * `aria-hidden` throughout: the option's own label already says what this shows, and a
 * screen reader announcing "diagram of a tail" after "spots on both lobes" is noise.
 */
export function TraitFigure({ figure }: { figure: TraitFigureKey }) {
  return (
    <svg viewBox="0 0 48 32" aria-hidden className="h-8 w-12 shrink-0">
      {FIGURES[figure]}
    </svg>
  );
}
