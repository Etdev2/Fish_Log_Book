import { BOAT_GAMES_V1 } from "@/features/games/flag";
import { PASSPORT_V1 } from "@/features/passport/flag";
import { FIN_ID } from "@/features/wildlife/flag";

/**
 * Every place in the app you can go, in one list.
 *
 * The bottom bar holds six destinations and cannot hold more — six labels already wrap to
 * two rows below 384px, and `shell-nav.tsx` records the measurement. So everything else
 * has been reachable only from inside another screen: the Passport and the Tackle Box
 * from Settings, Boat Games from the Fish Log, Fish ID from nowhere at all.
 *
 * That worked as an argument and failed as a product. The founder went looking for Boat
 * Games the day after it shipped, twice, and could not find it — and Boat Games at least
 * had a link on a screen he visits daily. "It is in Settings" is not findability; it is a
 * treasure hunt with a map only the person who hid it can read.
 *
 * This list is the map. The drawer renders it, and `destinations.test.ts` fails if a new
 * top-level route appears without either being added here or being named in the test's
 * exclusion list with a reason. A feature nobody can find is a feature nobody built.
 *
 * Pure data, no React, so the test can read it without a DOM.
 */

export interface Destination {
  readonly href: string;
  readonly label: string;
  /** One line, plain. What an angler would call the thing, not what the code calls it. */
  readonly blurb: string;
}

export interface DestinationGroup {
  readonly heading: string;
  readonly items: readonly Destination[];
}

/**
 * Grouped by when in a trip you want them, not by how the code is organised.
 *
 * Order inside each group is by how often it gets opened, so the common thing is nearest
 * the top of a scrolling panel rather than alphabetised into the middle.
 */
export function destinationGroups(): readonly DestinationGroup[] {
  const groups: DestinationGroup[] = [
    {
      heading: "Your fishing",
      items: [
        { href: "/", label: "Calendar", blurb: "Your days on the water, and what you caught" },
        { href: "/log", label: "Fish Log", blurb: "Every catch, searchable" },
        ...(PASSPORT_V1
          ? [
              {
                href: "/passport",
                label: "Fish Passport",
                blurb: "Species you have caught, personal bests, and slams",
              },
            ]
          : []),
      ],
    },
    {
      heading: "On the water",
      items: [
        { href: "/tides", label: "Tide", blurb: "Today's tide, and the days ahead" },
        { href: "/fish-legal", label: "Fish Legal", blurb: "Size and bag limits where you are" },
        { href: "/tournaments", label: "Tournaments", blurb: "Create, join, and follow fishing tournaments" },
        ...(BOAT_GAMES_V1
          ? [
              {
                href: "/games",
                label: "Boat Games",
                blurb: "Friendly competition with the crew, no signal needed",
              },
            ]
          : []),
        ...(FIN_ID
          ? [
              { href: "/fish-id", label: "Fish ID", blurb: "Work out what you just caught" },
              { href: "/fin-id", label: "Whale & dolphin ID", blurb: "What that fin belonged to" },
            ]
          : []),
      ],
    },
    {
      heading: "Your gear",
      items: [
        { href: "/setup", label: "Setup", blurb: "Rods, region, and the day's conditions" },
        { href: "/tackle", label: "Tackle Box", blurb: "The lures and baits you actually use" },
      ],
    },
    {
      heading: "The app",
      items: [
        { href: "/settings", label: "Settings", blurb: "Units, region, shortcuts, and your account" },
        { href: "/legal", label: "Notices", blurb: "Privacy, terms, and how your data is handled" },
      ],
    },
  ];

  // A group whose every item is behind an off flag would render as an empty heading.
  return groups.filter((group) => group.items.length > 0);
}

/** Flat, for the test and for anything that needs to ask "is this reachable?". */
export function allDestinations(): readonly Destination[] {
  return destinationGroups().flatMap((group) => group.items);
}
