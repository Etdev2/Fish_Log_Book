"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { getDemoEntry, hasSupabaseBrowserConfig } from "../demo-store";

/**
 * Who is actually entered, boat by boat.
 *
 * A host on a dock at 5am needs three things and no others: the boat's name, who is on it,
 * and a phone number that will be answered. This returns exactly that, sorted so the boats
 * still waiting on something come first — a confirmed field is a list you scroll past, and
 * the entries that need a person are the reason the screen is open.
 *
 * Row-level security decides what comes back. A member of the host organisation with
 * OWNER, ADMIN or STAFF sees the crews; everybody else gets nothing, and gets it without
 * an error, because "no rows" is the correct answer for somebody who is not staff.
 */

export interface RosterAngler {
  readonly id: string;
  readonly displayName: string;
  readonly phone: string | null;
  readonly captain: boolean;
  /** `tournament_entry.registration_status` — CONFIRMED once the payment is in. */
  readonly status: string;
}

export interface RosterBoat {
  readonly id: string;
  readonly name: string;
  readonly crew: readonly RosterAngler[];
  /** True when every angler on the boat is CONFIRMED. */
  readonly confirmed: boolean;
}

export type RosterLoad =
  | { readonly state: "loading" }
  | { readonly state: "ready"; readonly boats: readonly RosterBoat[] }
  | { readonly state: "error"; readonly message: string };

interface EntryRow {
  readonly id: string;
  readonly team_id: string | null;
  readonly registration_status: string;
}

interface IdentityRow {
  readonly tournament_entry_id: string;
  readonly display_name: string;
  readonly phone: string | null;
}

interface TeamRow {
  readonly id: string;
  readonly name: string;
}

interface MemberRow {
  readonly tournament_team_id: string;
  readonly tournament_entry_id: string;
  readonly role: string;
}

/** Boats with something outstanding first, then alphabetically, so the order is stable. */
function forTheDock(boats: readonly RosterBoat[]): readonly RosterBoat[] {
  return [...boats].sort((left, right) => {
    if (left.confirmed !== right.confirmed) return left.confirmed ? 1 : -1;
    return left.name.localeCompare(right.name);
  });
}

export function useRoster(tournamentId: string, enabled: boolean): RosterLoad {
  const [load, setLoad] = useState<RosterLoad>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      // A treasurer never opens the roster lane, so it never asks. Fetching anyway would
      // put a guaranteed-empty query on every load of the money screen.
      if (!enabled) {
        setLoad({ state: "ready", boats: [] });
        return;
      }

      setLoad({ state: "loading" });

      if (!hasSupabaseBrowserConfig()) {
        const demo = getDemoEntry(tournamentId);
        setLoad({
          state: "ready",
          boats:
            demo === null
              ? []
              : [
                  {
                    id: demo.id,
                    name: demo.display_name,
                    confirmed: true,
                    crew: [
                      {
                        id: demo.id,
                        displayName: demo.display_name,
                        phone: null,
                        captain: true,
                        status: "CONFIRMED",
                      },
                    ],
                  },
                ],
        });
        return;
      }

      try {
        const supabase = createClient();

        const entryResult = await supabase
          .from("tournament_entry")
          .select("id,team_id,registration_status")
          .eq("tournament_id", tournamentId)
          .is("deleted_at", null);

        if (cancelled) return;
        if (entryResult.error) {
          setLoad({ state: "error", message: entryResult.error.message });
          return;
        }

        const entries = (entryResult.data ?? []) as EntryRow[];
        if (entries.length === 0) {
          setLoad({ state: "ready", boats: [] });
          return;
        }

        const entryIds = entries.map((entry) => entry.id);
        const teamIds = [...new Set(entries.map((e) => e.team_id).filter((id): id is string => id !== null))];

        const [identityResult, memberResult, teamResult] = await Promise.all([
          supabase
            .from("tournament_entry_identity")
            .select("tournament_entry_id,display_name,phone")
            .in("tournament_entry_id", entryIds),
          supabase
            .from("tournament_team_member")
            .select("tournament_team_id,tournament_entry_id,role")
            .in("tournament_entry_id", entryIds),
          teamIds.length > 0
            ? supabase.from("tournament_team").select("id,name").in("id", teamIds)
            : Promise.resolve({ data: [] as TeamRow[], error: null }),
        ]);

        if (cancelled) return;

        const names = new Map<string, IdentityRow>();
        for (const row of (identityResult.data ?? []) as IdentityRow[]) {
          names.set(row.tournament_entry_id, row);
        }

        const captains = new Set<string>();
        for (const row of (memberResult.data ?? []) as MemberRow[]) {
          if (row.role === "CAPTAIN") captains.add(row.tournament_entry_id);
        }

        const teamNames = new Map<string, string>();
        for (const row of (teamResult.data ?? []) as TeamRow[]) teamNames.set(row.id, row.name);

        // Group by team. An entry with no team is its own boat — a single angler who
        // registered alone is still somebody the host has to account for, and dropping it
        // would make the field size on this screen disagree with the one on the overview.
        const grouped = new Map<string, RosterAngler[]>();
        for (const entry of entries) {
          const key = entry.team_id ?? `solo:${entry.id}`;
          const identity = names.get(entry.id);
          const crew = grouped.get(key) ?? [];
          crew.push({
            id: entry.id,
            // An entry whose identity row is hidden or missing still has to appear: a boat
            // silently absent from the dock list is the failure this screen must not have.
            displayName: identity?.display_name ?? "Name not recorded",
            phone: identity?.phone ?? null,
            captain: captains.has(entry.id),
            status: entry.registration_status,
          });
          grouped.set(key, crew);
        }

        const boats: RosterBoat[] = [...grouped.entries()].map(([key, crew]) => ({
          id: key,
          name:
            teamNames.get(key) ??
            crew.find((angler) => angler.captain)?.displayName ??
            crew[0]?.displayName ??
            "Entry",
          crew: [...crew].sort((left, right) =>
            left.captain === right.captain
              ? left.displayName.localeCompare(right.displayName)
              : left.captain
                ? -1
                : 1,
          ),
          confirmed: crew.every((angler) => angler.status === "CONFIRMED"),
        }));

        setLoad({ state: "ready", boats: forTheDock(boats) });
      } catch (cause) {
        if (cancelled) return;
        setLoad({
          state: "error",
          message: cause instanceof Error ? cause.message : "The roster could not be loaded.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tournamentId, enabled]);

  return load;
}
