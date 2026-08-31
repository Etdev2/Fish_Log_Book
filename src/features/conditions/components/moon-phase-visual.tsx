import type { MoonPhase } from "@/core/rules/astro";

import { formatMoonIllumination, formatMoonPhaseName } from "../format";

const CENTRE = 50;
const RADIUS = 42;
const TOP = CENTRE - RADIUS;
const BOTTOM = CENTRE + RADIUS;

/**
 * A true phase silhouette rather than an eight-icon approximation. The bright limb is a
 * circular arc and the terminator is an ellipse whose width comes directly from the
 * illuminated fraction. At 0%, the two arcs cancel; at 50%, the terminator is a straight
 * line; at 100%, the arcs make a full disc. Waning phases mirror the waxing geometry.
 */
export function moonLightPath(illumination: number): string {
  const fraction = Math.max(0, Math.min(1, illumination));
  const terminatorRadius = RADIUS * Math.abs(2 * fraction - 1);
  const terminatorSweep = fraction <= 0.5 ? 0 : 1;

  return [
    `M ${CENTRE} ${TOP}`,
    `A ${RADIUS} ${RADIUS} 0 0 1 ${CENTRE} ${BOTTOM}`,
    `A ${terminatorRadius.toFixed(3)} ${RADIUS} 0 0 ${terminatorSweep} ${CENTRE} ${TOP}`,
    "Z",
  ].join(" ");
}

function isWaning(name: MoonPhase["name"]): boolean {
  return name === "last-quarter" || name.startsWith("waning");
}

export function MoonPhaseVisual({
  phase,
  id,
  className,
  compact = false,
}: {
  phase: MoonPhase;
  id: string;
  className?: string;
  compact?: boolean;
}) {
  const lightPath = moonLightPath(phase.illumination);
  const mirror = isWaning(phase.name) ? "translate(100 0) scale(-1 1)" : undefined;
  const darkGradientId = `${id}-moon-dark`;
  const discClipId = `${id}-moon-disc`;
  const lightClipId = `${id}-moon-light-clip`;
  const accessibleName = `${formatMoonPhaseName(phase.name)}, ${formatMoonIllumination(phase.illumination)}`;

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      role={compact ? undefined : "img"}
      aria-hidden={compact || undefined}
      aria-label={compact ? undefined : accessibleName}
    >
      <defs>
        <radialGradient id={darkGradientId} cx="38%" cy="30%" r="72%">
          <stop offset="0" stopColor="#56616A" />
          <stop offset=".52" stopColor="#252E35" />
          <stop offset="1" stopColor="#0C1216" />
        </radialGradient>
        <clipPath id={discClipId}>
          <circle cx={CENTRE} cy={CENTRE} r={RADIUS} />
        </clipPath>
        <clipPath id={lightClipId}>
          <path d={lightPath} transform={mirror} />
        </clipPath>
      </defs>

      <circle cx={CENTRE} cy={CENTRE} r={RADIUS + 3} fill="#E8D9A8" opacity=".08" />
      <circle cx={CENTRE} cy={CENTRE} r={RADIUS} fill={`url(#${darkGradientId})`} />
      <image
        href="/images/moon-surface.png"
        x="8"
        y="8"
        width="84"
        height="84"
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${discClipId})`}
        opacity={compact ? ".12" : ".18"}
        aria-hidden="true"
      />
      <image
        href="/images/moon-surface.png"
        x="8"
        y="8"
        width="84"
        height="84"
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${lightClipId})`}
        opacity={compact ? ".9" : ".96"}
        aria-hidden="true"
      />
      <path d={lightPath} transform={mirror} fill="#FFF3C4" opacity={compact ? ".1" : ".12"} />

      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={RADIUS}
        fill="none"
        stroke="#E8D9A8"
        strokeWidth="1.4"
        opacity=".5"
        aria-hidden="true"
      />
    </svg>
  );
}
