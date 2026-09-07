"use client";

import { useState } from "react";

import type { OrderDraft } from "@/core/tournaments/registration";
import { WalletFailure, connectWallet } from "@/lib/wallet/browser-wallet";

import { TEST_CARDS } from "../checkout/test-gateways";
import { useCheckout, type CheckoutState, type PaymentMethod } from "../checkout/use-checkout";
import { formatMoney } from "../event-card";
import {
  BIG_ACTION,
  CARD_PADDED,
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  INPUT,
  INSET,
  SECONDARY_BUTTON,
  TABULAR,
} from "../ui-classes";
import { AlertIcon, CheckIcon, PendingIcon } from "./icons";

/**
 * Paying for the order — by card, or from a browser wallet.
 *
 * One screen, two methods, one total (ADR 010 §2). The method is a choice at the top; the
 * bill, the refund policy and the pay button below it are the same either way, because the
 * thing being bought does not change with how it is paid for.
 *
 * **Test mode is stated, not implied.** No key that can move money exists in this
 * repository (ADR 010 §3), and a payment screen that looks exactly like a live one is how
 * somebody ends up believing they have entered a tournament. The banner says so at the top,
 * and the crypto quote's address is the burn address for the same reason.
 */
export interface EventRefundPolicy {
  readonly eventId: string;
  readonly eventName: string;
  readonly policy: string | null;
}

export function CheckoutPanel({
  orderId,
  draft,
  refundPolicies,
  ready,
  blockedReason,
  onPaid,
}: {
  orderId: string;
  draft: OrderDraft;
  /** One per event being paid for — see the note where these render. */
  refundPolicies: readonly EventRefundPolicy[];
  ready: boolean;
  blockedReason: string | null;
  onPaid: (reference: string) => void;
}) {
  const checkout = useCheckout({
    orderId,
    totalMinor: draft.totalMinor,
    currency: draft.currency,
  });
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [card, setCard] = useState<string>(TEST_CARDS.success);
  const [walletNote, setWalletNote] = useState<string | null>(null);

  const total = formatMoney(draft.totalMinor, draft.currency) ?? "—";
  /* Read once and narrow on the local: `checkout.state` inside a closure is re-read on
     access, so TypeScript cannot carry a narrowing across it. */
  const state = checkout.state;
  const busy = state.kind === "working" || state.kind === "confirming";

  if (state.kind === "paid") {
    return (
      <section className={`${CARD_PADDED} flex flex-col gap-space-3`} aria-live="polite">
        <h2 className="flex items-center gap-space-2 text-h3 text-success-green">
          <CheckIcon />
          Paid — you are entered
        </h2>
        <p className="text-body text-text-primary">
          {total} for {draft.lines.length} {draft.lines.length === 1 ? "item" : "items"}.
        </p>
        <p className={`text-caption text-text-muted ${TABULAR}`}>Reference {state.reference}</p>
        <button type="button" onClick={() => onPaid(state.reference)} className={BIG_ACTION}>
          See my tournaments
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-space-4" aria-labelledby="pay-heading">
      <h2 id="pay-heading" className="text-h3 text-text-primary">
        Pay
      </h2>

      <p className={`${INSET} text-caption text-amber-flag`}>
        Test mode. No card is charged and no transaction is sent. This is the real payment
        flow with no live payment provider connected.
      </p>

      {/* The bill, itemised. One line per thing bought, and the total underneath. */}
      <div className={`${CARD_PADDED} flex flex-col gap-space-2`}>
        <ul className="flex flex-col gap-space-2">
          {draft.lines.map((line) => (
            <li key={line.referenceId} className="flex items-baseline justify-between gap-space-3">
              <span className="min-w-0 text-body text-text-primary">{line.description}</span>
              <span className={`shrink-0 text-body text-text-primary ${TABULAR}`}>
                {formatMoney(line.totalAmountMinor, draft.currency)}
              </span>
            </li>
          ))}
          {draft.lines.length === 0 ? (
            <li className="text-body text-text-muted">Nothing to pay for yet.</li>
          ) : null}
        </ul>
        <div className="flex items-baseline justify-between gap-space-3 border-t border-hairline pt-space-2">
          <span className="text-body-strong text-text-primary">Total</span>
          <span className={`text-h3 text-text-primary ${TABULAR}`}>{total}</span>
        </div>
      </div>

      {/*
        The refund policy, above the pay button, in the host's own words (ADR 010 §4).
        Weather cancellation is routine in this sport and "what happens to my $400" is the
        first thing a person asks.

        One per event, because one order can cover several events run by different hosts on
        different terms. Showing a single policy for a $900 order that spans two events would
        be telling somebody the rules of an event they are also paying for do not apply. An
        event with no policy says so rather than borrowing the one above it.
      */}
      <div className={`${CARD_PADDED} flex flex-col gap-space-3`}>
        <h3 className="text-body-strong text-text-primary">If you withdraw, or it is cancelled</h3>
        {refundPolicies.map((entry) => (
          <div key={entry.eventId} className="flex flex-col gap-space-1">
            {refundPolicies.length > 1 ? (
              <p className="text-caption text-text-muted">{entry.eventName}</p>
            ) : null}
            <p className="text-body text-text-muted">
              {entry.policy ??
                "This host has not published a refund policy. Ask them before you pay."}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-space-2" role="group" aria-label="How to pay">
        {(["card", "wallet"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={method === option}
            disabled={busy}
            onClick={() => setMethod(option)}
            className={`${CHIP} flex-1 ${method === option ? CHIP_ON : CHIP_OFF}`}
          >
            {option === "card" ? "Card" : "Wallet"}
          </button>
        ))}
      </div>

      {method === "card" ? (
        <div className="flex flex-col gap-space-3">
          <label className="flex flex-col gap-space-1">
            <span className="text-caption text-text-muted">Card number (test)</span>
            <input
              type="text"
              inputMode="numeric"
              value={card}
              disabled={busy}
              onChange={(event) => setCard(event.target.value)}
              className={`${INPUT} ${TABULAR}`}
            />
          </label>
          <p className="text-caption text-text-muted">
            {TEST_CARDS.success} succeeds · {TEST_CARDS.declined} is declined ·{" "}
            {TEST_CARDS.requiresAction} needs a second step.
          </p>
        </div>
      ) : (
        <WalletMethod
          available={checkout.walletAvailable}
          currency={draft.currency}
          note={walletNote}
          onNote={setWalletNote}
        />
      )}

      <StateLine state={state} />

      {blockedReason ? <p className="text-caption text-amber-flag">{blockedReason}</p> : null}

      {state.kind === "awaiting-wallet" ? (
        <button
          type="button"
          className={BIG_ACTION}
          onClick={() => {
            /*
              Test mode sends nothing. A plausible hash stands in for the one a wallet would
              return, and the provider's real observation logic — chain, asset, recipient,
              amount, confirmations — runs against it exactly as it would on a live chain.
            */
            const hash = `0x${orderId.replace(/\W/g, "").padEnd(64, "0").slice(0, 64)}`;
            void checkout.submitWalletTransaction(hash, state.quote);
          }}
        >
          Send {formatMoney(draft.totalMinor, draft.currency)} from wallet
        </button>
      ) : (
        <button
          type="button"
          disabled={!ready || busy}
          className={BIG_ACTION}
          onClick={() => {
            if (method === "card") void checkout.payByCard(card);
            else void checkout.startWalletPayment();
          }}
        >
          {busy ? "Working…" : method === "card" ? `Pay ${total}` : `Get a quote for ${total}`}
        </button>
      )}

      {state.kind === "failed" ? (
        <button type="button" onClick={checkout.reset} className={SECONDARY_BUTTON}>
          Try again
        </button>
      ) : null}
    </section>
  );
}

/**
 * The wallet half of the method chooser.
 *
 * Connecting is a separate, explicit tap. A page that opens a wallet dialog on load is how
 * people learn to dismiss wallet dialogs without reading them, and the one they dismiss
 * without reading will eventually be a real one.
 */
function WalletMethod({
  available,
  currency,
  note,
  onNote,
}: {
  available: boolean;
  currency: string;
  note: string | null;
  onNote: (note: string | null) => void;
}) {
  const [address, setAddress] = useState<string | null>(null);

  if (!available) {
    /*
      No wallet installed. In test mode the quote and the confirmation still run, because a
      founder reviewing this on a phone with no extension has to be able to see the flow at
      all — and nothing is sent either way. When a live gateway is configured this is where
      the method stops being offered.
    */
    return (
      <p className={`${INSET} text-body text-text-muted`}>
        No browser wallet found on this device. Any extension that speaks the standard works
        — MetaMask, Rabby, Coinbase Wallet. You can still walk through the quote here,
        because nothing is sent in test mode.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-space-2">
      {address ? (
        <p className={`text-caption text-text-muted ${TABULAR}`}>
          Connected {address.slice(0, 6)}…{address.slice(-4)}
        </p>
      ) : (
        <button
          type="button"
          className={SECONDARY_BUTTON}
          onClick={() => {
            void (async () => {
              try {
                const connection = await connectWallet();
                setAddress(connection.address);
                onNote(null);
              } catch (cause) {
                onNote(
                  cause instanceof WalletFailure && cause.detail.kind === "rejected"
                    ? "The wallet request was dismissed. Nothing has been sent."
                    : "That wallet could not be reached. You can pay by card instead.",
                );
              }
            })();
          }}
        >
          Connect wallet
        </button>
      )}
      {/* ADR 010 §2, said plainly: the price is in money, and the token tracks it. */}
      <p className="text-caption text-text-muted">
        The price is set in {currency.toUpperCase()}. Your wallet sends the matching amount of
        a {currency.toUpperCase()}-pegged token, so the total never moves with the market.
      </p>
      {note ? <p className="text-caption text-amber-flag">{note}</p> : null}
    </div>
  );
}

/** What is happening right now, in words, including the states that take time. */
function StateLine({ state }: { state: CheckoutState }) {
  if (state.kind === "idle") return null;

  if (state.kind === "awaiting-wallet") {
    return (
      <div className={`${INSET} flex flex-col gap-space-1`} aria-live="polite">
        <p className="text-body text-text-primary">
          Send {state.quote.cryptoAsset} on chain {state.quote.chainId}
        </p>
        {/* The whole address, wrapping cleanly — `break-all` because a 42-character hex
            string has no spaces to break at and would otherwise run off a phone. It is
            shown in full rather than truncated so it can be checked against the wallet. */}
        <p className={`text-caption break-all text-text-muted ${TABULAR}`}>
          To {state.quote.recipientAddress}
        </p>
        <p className="text-caption text-text-muted">
          This quote expires at {new Date(state.quote.expiresAt).toLocaleTimeString()}. After that
          you will need a new one — the price is fixed until then.
        </p>
      </div>
    );
  }

  if (state.kind === "confirming") {
    return (
      <p className="flex items-center gap-space-2 text-body text-text-muted" aria-live="polite">
        <PendingIcon />
        {/* Not "paid". The order is not paid until the network says so. */}
        Waiting for the network to confirm. Do not send it again.
      </p>
    );
  }

  if (state.kind === "action-required") {
    return (
      <p className="flex items-center gap-space-2 text-body text-text-muted" aria-live="polite">
        <PendingIcon />
        Your bank asked for an extra step. Finishing it now.
      </p>
    );
  }

  if (state.kind === "failed") {
    return (
      <p className="flex items-start gap-space-2 text-body text-error-red" role="alert">
        <AlertIcon />
        {state.message}
      </p>
    );
  }

  return null;
}
