"use client";

import { useEffect, useState } from "react";

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

export interface TournamentMoney {
  /** ISO currency of the orders. Null when there are none to have one. */
  readonly currency: string | null;
  /** Sum of PAID orders, in minor units. */
  readonly collectedMinor: number;
  /** Sum of orders that have been started and not paid, in minor units. */
  readonly outstandingMinor: number;
  /** Orders that reached PAID. */
  readonly paidOrders: number;
  /** Orders started and not yet paid — a checkout somebody abandoned, or a pending webhook. */
  readonly unpaidOrders: number;
  /** Refunded or partly refunded orders, which a host will be asked about. */
  readonly refundedOrders: number;
}

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
};

interface OrderRow {
  readonly currency: string;
  readonly total_minor: number | string;
  readonly status: string;
}

const PAID = new Set(["PAID", "PARTIALLY_REFUNDED"]);
const OWED = new Set(["DRAFT", "PENDING_PAYMENT"]);
const REFUNDED = new Set(["REFUNDED", "PARTIALLY_REFUNDED"]);

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
          .from("tournament_order")
          .select("currency,total_minor,status")
          .eq("tournament_id", tournamentId);

        if (cancelled) return;
        if (error) {
          setLoad({ state: "error", message: error.message });
          return;
        }

        let collectedMinor = 0;
        let outstandingMinor = 0;
        let paidOrders = 0;
        let unpaidOrders = 0;
        let refundedOrders = 0;
        let currency: string | null = null;

        for (const row of (data ?? []) as OrderRow[]) {
          // bigint arrives as a string once it passes the safe-integer range. Number() on
          // the string is right; reading it as a number field is not.
          const total = Number(row.total_minor);
          if (!Number.isFinite(total)) continue;
          currency ??= row.currency;

          if (PAID.has(row.status)) {
            collectedMinor += total;
            paidOrders += 1;
          }
          if (OWED.has(row.status)) {
            outstandingMinor += total;
            unpaidOrders += 1;
          }
          if (REFUNDED.has(row.status)) refundedOrders += 1;
        }

        setLoad({
          state: "ready",
          money: { currency, collectedMinor, outstandingMinor, paidOrders, unpaidOrders, refundedOrders },
        });
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
