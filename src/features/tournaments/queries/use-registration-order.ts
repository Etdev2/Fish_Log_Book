"use client";

import { useCallback } from "react";

import type { CrewMember, RegistrationSelection } from "@/core/tournaments/registration";
import { createClient } from "@/lib/supabase/client";

import { hasSupabaseBrowserConfig, registerDemoEntry } from "../demo-store";

/**
 * Creating the real order and the real entries, before a penny is taken.
 *
 * The order in which these two things happen is the whole design, and it is the opposite
 * of the obvious one. Pay first and then register, and a payment that succeeds while the
 * registration fails leaves somebody charged and not entered, with nothing on the server
 * that knows they tried. Register first and the worst case is an unpaid PENDING order,
 * which is a row a host can see, chase, or expire.
 *
 * So: `register_crew_for_tournaments` runs first and creates the order, the boat, one entry
 * per angler per event, and the bill — all PENDING. Then the payment is taken against that
 * order id. Then, and only then, a confirmation from the payment provider activates the
 * entries, server-side, in `confirm_tournament_order`.
 *
 * **That last step cannot happen from here, deliberately.** If the browser could confirm an
 * order, the checkout would be optional: skip the paying, call the confirming. So there is
 * no client path to it, and until a payment webhook exists an entry stays PENDING after a
 * test-mode payment. The screens say so rather than claiming an entry that does not exist.
 */

export interface OrderRequest {
  readonly crew: readonly CrewMember[];
  readonly selection: RegistrationSelection;
  /** Which divisions belong to which event, so the call can be shaped per event. */
  readonly divisionsByEvent: ReadonlyMap<string, readonly string[]>;
  /** Stable for one attempt — see the idempotency note in the migration. */
  readonly idempotencyKey: string;
}

export type OrderResult =
  | { readonly ok: true; readonly orderId: string; readonly serverBacked: boolean }
  | { readonly ok: false; readonly message: string };

export function useRegistrationOrder() {
  return useCallback(async (request: OrderRequest): Promise<OrderResult> => {
    if (!hasSupabaseBrowserConfig()) {
      // Demo mode has no server to write to. The entry is recorded on the device so the
      // rest of the app behaves, and the order id is local.
      const captain = request.crew.find((member) => member.isCaptain);
      for (const id of request.selection.eventIds) {
        registerDemoEntry(id, captain?.displayName.trim() || "My boat");
      }
      return { ok: true, orderId: `demo-order-${request.idempotencyKey}`, serverBacked: false };
    }

    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        return { ok: false, message: "Sign in before registering, so the entry is yours." };
      }

      const registrations = request.selection.eventIds.map((eventId) => ({
        tournament_id: eventId,
        division_ids: (request.divisionsByEvent.get(eventId) ?? []).filter((id) =>
          request.selection.divisionIds.includes(id),
        ),
      }));

      const { data, error } = await supabase.rpc("register_crew_for_tournaments", {
        registrations,
        crew: request.crew.map((member) => ({
          display_name: member.displayName.trim(),
          email: member.email,
          phone: member.phone,
          is_captain: member.isCaptain,
        })),
        idempotency_key: request.idempotencyKey,
      });

      if (error) return { ok: false, message: error.message };
      if (typeof data !== "string") {
        return { ok: false, message: "The tournament server did not return an order." };
      }
      return { ok: true, orderId: data, serverBacked: true };
    } catch (cause) {
      return {
        ok: false,
        message: cause instanceof Error ? cause.message : "The registration could not be created.",
      };
    }
  }, []);
}
