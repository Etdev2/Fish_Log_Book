"use client";

import { useEffect, useState } from "react";

import { parseTournamentMoneyTotals, type TournamentMoney } from "@/core/tournaments/ledger-totals";

import { createClient } from "@/lib/supabase/client";

import { hasSupabaseBrowserConfig } from "../demo-store";

/**
 * What has been collected, what is still owed, and what is in the pot.
 *
 * The money panel used to print "Nothing has been taken and nothing is owed" as a constant.
 * On a real database that sentence was going to stay on the screen after the first entry
 * fee landed, which is the worst kind of wrong: a plausible number nobody checks. It is
 * read from `tournament_order` now, or it says it could not be read.
 *
 * Totals are minor units and stay integers the whole way. Dividing by 100 to add things up
 * is how a ledger ends up eight cents short of the bank.
 */

export type { TournamentMoney } from "@/core/tournaments/ledger-totals";

export type MoneyLoad =
  | { readonly state: "loading" }
  | { readonly state: "ready"; readonly money: TournamentMoney }
  /** Distinct from zero. A host who cannot read the ledger must not be shown a zero. */
  | { readonly state: "error"; readonly message: string };

const NOTHING: TournamentMoney = {
  currency: null,
  collectedMinor: 0,
  outstandingMinor: 0,
  paidOrders: 0,
  unpaidOrders: 0,
  refundedOrders: 0,
  unpricedOrders: 0,
};

export function useTournamentMoney(tournamentId: string, enabled: boolean): MoneyLoad {
  const [load, setLoad] = useState<MoneyLoad>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      // Event staff cannot read the ledger, and the lane is hidden from them. Not asking
      // keeps a denied query out of the console on every load of the dock screen.
      if (!enabled) {
        setLoad({ state: "ready", money: NOTHING });
        return;
      }

      setLoad({ state: "loading" });

      if (!hasSupabaseBrowserConfig()) {
        // Demo data has no orders behind it, and inventing some would put a number on the
        // screen that no payment produced.
        setLoad({ state: "ready", money: NOTHING });
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .rpc("tournament_money_totals", { target_tournament_id: tournamentId })
          .single();

        if (cancelled) return;
        if (error) {
          setLoad({ state: "error", message: error.message });
          return;
        }

        setLoad({ state: "ready", money: parseTournamentMoneyTotals(data) });
      } catch (cause) {
        if (cancelled) return;
        setLoad({
          state: "error",
          message: cause instanceof Error ? cause.message : "The takings could not be read.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tournamentId, enabled]);

  return load;
}
