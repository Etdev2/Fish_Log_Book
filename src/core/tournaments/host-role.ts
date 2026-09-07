/**
 * What a host may actually do, and who counts as a host.
 *
 * The database has had four organisation roles since the first tournament migration —
 * OWNER, ADMIN, STAFF, FINANCE — and until this file existed, nothing on the screen ever
 * asked which one you held. `/tournaments/[id]/operations` rendered "Host controls",
 * the judging queue and the money panel to anybody who typed the URL. Row-level security
 * meant the *data* behind those panels stayed empty for a stranger, so nothing leaked;
 * what leaked was the impression that they were the host, which is its own kind of wrong
 * on a screen with a "Cancel the tournament" button on it.
 *
 * The capability table below is the single answer to "may I", and the screen asks it
 * rather than guessing from a status or a `hosting` flag. It is deliberately a plain
 * lookup with no I/O: the server decides what a request may touch, and this decides what
 * a person is shown. Those are different jobs and the second one must never be mistaken
 * for the first.
 *
 * `host-role.sql.test.ts` reads the migrations and fails if the two drift apart.
 */

/** The organisation roles from `organization_member.role`'s check constraint. */
export const HOST_ROLES = ["OWNER", "ADMIN", "STAFF", "FINANCE"] as const;

export type HostRole = (typeof HOST_ROLES)[number];

export function isHostRole(value: unknown): value is HostRole {
  return typeof value === "string" && (HOST_ROLES as readonly string[]).includes(value);
}

export interface HostCapabilities {
  /** Sees the host screen at all, rather than being sent back to the public page. */
  readonly runEvent: boolean;
  /** Moves the tournament between states, and edits rules, scoring and boundaries. */
  readonly changeEventSettings: boolean;
  /** Reads the entrant roster: boats, crews, check-in, entry status. */
  readonly readRoster: boolean;
  /** Changes an entry — approving, waitlisting, checking in, withdrawing. */
  readonly writeRoster: boolean;
  /** Reviews catches, records penalties, settles disputes. */
  readonly judge: boolean;
  /** Reads what has been collected, what is owed, and the prize pool. */
  readonly readMoney: boolean;
  /** Approves a payout instruction. Deliberately narrower than reading the money. */
  readonly approvePayout: boolean;
  /** Adds, removes or re-roles the people on the host team. */
  readonly manageStaff: boolean;
}

const NOBODY: HostCapabilities = {
  runEvent: false,
  changeEventSettings: false,
  readRoster: false,
  writeRoster: false,
  judge: false,
  readMoney: false,
  approvePayout: false,
  manageStaff: false,
};

/*
  Each row mirrors the role arrays in the RLS policies. Where the SQL says
  `array['OWNER','ADMIN','STAFF']`, the three of them have the capability and the fourth
  does not — see the SQL parity test.

  FINANCE is the row this file was written for. It was in the check constraint from day
  one and named by no policy anywhere, so granting it to a club treasurer gave them
  strictly less than STAFF: they could not read an order, a payment, or a prize pool. The
  only way to let somebody handle the money was to make them an ADMIN, which also hands
  them the rules, the scoring and the power to cancel the event. This release gives
  FINANCE the money and nothing else, which is the separation the operations screen has
  been promising in prose since it was written.
*/
const CAPABILITIES: Readonly<Record<HostRole, HostCapabilities>> = {
  OWNER: {
    runEvent: true,
    changeEventSettings: true,
    readRoster: true,
    writeRoster: true,
    judge: true,
    readMoney: true,
    approvePayout: true,
    manageStaff: true,
  },
  ADMIN: {
    runEvent: true,
    changeEventSettings: true,
    readRoster: true,
    writeRoster: true,
    judge: true,
    readMoney: true,
    approvePayout: true,
    manageStaff: true,
  },
  // Runs the event on the dock. Sees who is entered and judges the fish; the money is
  // somebody else's job, and so is who else gets to be staff.
  STAFF: {
    runEvent: true,
    changeEventSettings: false,
    readRoster: true,
    writeRoster: true,
    judge: true,
    readMoney: false,
    approvePayout: false,
    manageStaff: false,
  },
  // The treasurer. Reads every number and approves nothing about the fishing: cannot
  // change a rule, cannot judge a catch, cannot touch an entry. Approving a payout is the
  // one thing this role does that OWNER and ADMIN also do.
  FINANCE: {
    runEvent: true,
    changeEventSettings: false,
    readRoster: false,
    writeRoster: false,
    judge: false,
    readMoney: true,
    approvePayout: true,
    manageStaff: false,
  },
};

/**
 * Capabilities for a role, or none at all for somebody who holds no active membership.
 *
 * `null` is the ordinary case, not an error: most people looking at a tournament are
 * entrants or spectators.
 */
export function hostCapabilities(role: HostRole | null): HostCapabilities {
  return role === null ? NOBODY : CAPABILITIES[role];
}

/** True when this role should be offered the host screen at all. */
export function isHost(role: HostRole | null): boolean {
  return hostCapabilities(role).runEvent;
}

/** How the role is named to the person holding it. Not a database value. */
export const HOST_ROLE_LABEL: Readonly<Record<HostRole, string>> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  STAFF: "Event staff",
  FINANCE: "Treasurer",
};

/** One line explaining the role's limits, shown on the host screen. */
export const HOST_ROLE_SUMMARY: Readonly<Record<HostRole, string>> = {
  OWNER: "You can do everything here, including the money and who else gets access.",
  ADMIN: "You can run the event, judge, and handle the money.",
  STAFF: "You can run the event and judge. The money is somebody else's job.",
  FINANCE: "You handle the money. Rules, judging and the roster are somebody else's job.",
};

export type HostLane = "event" | "roster" | "judging" | "money" | "team";

const LANE_CAPABILITY: Readonly<Record<HostLane, keyof HostCapabilities>> = {
  event: "runEvent",
  roster: "readRoster",
  judging: "judge",
  money: "readMoney",
  team: "manageStaff",
};

const LANE_ORDER: readonly HostLane[] = ["event", "roster", "judging", "money", "team"];

/**
 * The lanes this role may open, in reading order.
 *
 * A treasurer gets "Event" and "Money" and no empty judging queue to wonder about. The
 * screen picks its opening lane from the front of this list, so nobody lands on a tab
 * they are not allowed to use.
 */
export function visibleLanes(caps: HostCapabilities): readonly HostLane[] {
  return LANE_ORDER.filter((lane) => caps[LANE_CAPABILITY[lane]]);
}
