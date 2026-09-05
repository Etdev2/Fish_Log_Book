/**
 * The tournament section's icons, inline (ADR 005 §6 — no icon package).
 *
 * Every one of them is decorative: `aria-hidden`, `currentColor`, sized by a spacing token
 * on the element rather than a literal. The house rule from `docs/design/04-components.md`
 * holds everywhere they are used — **an icon never ships without its word**. These are here
 * to make a state findable at a glance in glare, not to replace the label that says what
 * the state is.
 */

/**
 * `size` and `className` are separate on purpose. Passing a size through `className` used
 * to replace the default one, which is how a decorative chevron ended up rendered at 200px
 * on the overview screen — the kind of mistake that only shows up in a screenshot.
 */
type IconProps = { readonly className?: string; readonly size?: string };

const BASE = "shrink-0";

/** Something is done, satisfied, present. */
export function CheckIcon({ className = "", size = "h-space-5 w-space-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${BASE} ${size} ${className}`}
    >
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  );
}

/** Something a person needs to look at. Never "you did something wrong". */
export function AlertIcon({ className = "", size = "h-space-5 w-space-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${BASE} ${size} ${className}`}
    >
      <path d="M10 2.75 18.5 17.25H1.5Z" />
      <path d="M10 8v3.5" />
      <path d="M10 14.4h.01" />
    </svg>
  );
}

/** Not done yet, and nothing is wrong with that. */
export function PendingIcon({ className = "", size = "h-space-5 w-space-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={`${BASE} ${size} ${className}`}
    >
      <circle cx="10" cy="10" r="7.5" strokeDasharray="3 3.4" />
    </svg>
  );
}

/** A frozen competition input: rules, scoring, checks, boundaries. */
export function LockIcon({ className = "", size = "h-space-5 w-space-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${BASE} ${size} ${className}`}
    >
      <rect x="3.75" y="8.5" width="12.5" height="8.75" rx="2" />
      <path d="M6.75 8.5V6a3.25 3.25 0 0 1 6.5 0v2.5" />
    </svg>
  );
}

export function ClockIcon({ className = "", size = "h-space-5 w-space-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${BASE} ${size} ${className}`}
    >
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.75V10l3 2" />
    </svg>
  );
}

export function TrophyIcon({ className = "", size = "h-space-5 w-space-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${BASE} ${size} ${className}`}
    >
      <path d="M6 2.75h8v4a4 4 0 0 1-8 0Z" />
      <path d="M6 3.75H3.5v1.5a3 3 0 0 0 2.6 2.97" />
      <path d="M14 3.75h2.5v1.5a3 3 0 0 1-2.6 2.97" />
      <path d="M10 10.75v3.5" />
      <path d="M6.75 17.25h6.5l-.75-3h-5Z" />
    </svg>
  );
}

/** The "there is more this way" arrow on a card that is a link. */
export function ChevronIcon({ className = "", size = "h-space-5 w-space-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${BASE} ${size} ${className}`}
    >
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

export function BackIcon({ className = "", size = "h-space-4 w-space-4" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${BASE} ${size} ${className}`}
    >
      <path d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  );
}

export function PlusIcon({ className = "", size = "h-space-5 w-space-5" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      className={`${BASE} ${size} ${className}`}
    >
      <path d="M10 4.25v11.5M4.25 10h11.5" />
    </svg>
  );
}
