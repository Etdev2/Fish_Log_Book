"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { CryptoPaymentProvider, type CryptoQuote } from "@/core/tournaments/crypto-provider";
import { paymentCanActivateRegistration, type PaymentResult } from "@/core/tournaments/payments";
import { StripePaymentProvider } from "@/core/tournaments/stripe-provider";
import { hasBrowserWallet } from "@/lib/wallet/browser-wallet";

import { TestCryptoGateway, TestStripeClient } from "./test-gateways";

/**
 * Paying for one order, by card or by wallet.
 *
 * The two methods are two `PaymentProvider`s behind one port and one screen (ADR 010 §2),
 * so this hook is the same shape for both: start a payment, then keep asking the provider
 * what happened until it stops being "pending".
 *
 * The states are the honest ones, and there are more than two:
 *
 * - `action-required` — the card needs a second step. Cards do this routinely.
 * - `confirming` — a transaction is on its way but not yet final. **The order is not paid
 *   while this is showing.** A hash is a promise, not a receipt, and resolving optimistically
 *   here would register people who have not paid (ADR 010 §2).
 *
 * `paid` is set from `paymentCanActivateRegistration`, never from a status string compared
 * inline, so the one rule about what activates a registration lives in one place.
 */

export type PaymentMethod = "card" | "wallet";

export type CheckoutState =
  | { readonly kind: "idle" }
  | { readonly kind: "working" }
  | { readonly kind: "action-required" }
  | { readonly kind: "awaiting-wallet"; readonly quote: CryptoQuote }
  | { readonly kind: "confirming"; readonly txHash: string }
  | { readonly kind: "paid"; readonly reference: string }
  | { readonly kind: "failed"; readonly message: string };

export interface CheckoutOrder {
  readonly totalMinor: number;
  readonly currency: string;
  /**
   * Creates the order on the server and returns its id, or explains why it could not.
   *
   * Called at the moment the angler commits to paying, not on mount: an order created when
   * a form loads is a PENDING row for everybody who ever opened the screen. Idempotent, so
   * a second tap returns the first order rather than a second one.
   */
  readonly createOrder: () => Promise<{ ok: true; orderId: string } | { ok: false; message: string }>;
}

/* Module-level so their identity is stable across renders; `useSyncExternalStore`
   resubscribes whenever its subscribe function changes. */
const NO_SUBSCRIPTION = () => () => {};
const SERVER_HAS_NO_WALLET = () => false;

/** How long to keep asking before admitting the network is not going to answer. */
const CONFIRM_TIMEOUT_MS = 90_000;
const POLL_MS = 1500;

export function useCheckout(order: CheckoutOrder) {
  const [state, setState] = useState<CheckoutState>({ kind: "idle" });
  /*
    Whether a wallet is installed can only be known on the client, and reading it during
    render would make the server's HTML disagree with the first client render.

    `useSyncExternalStore` rather than an effect that calls `setState`: setting state
    synchronously in an effect body is a cascading render, and with the React Compiler on it
    is the shape that behaves differently from what the code appears to say — the repo's
    lint rules reject it outright. An injected provider does not appear part-way through a
    session, so the subscribe function has nothing to listen for and returns a no-op.
  */
  const walletAvailable = useSyncExternalStore(
    NO_SUBSCRIPTION,
    hasBrowserWallet,
    SERVER_HAS_NO_WALLET,
  );

  /* One gateway instance per checkout, held across renders: the crypto gateway remembers
     which quote a transaction belongs to, and a new one per render would forget. */
  const cryptoGateway = useRef<TestCryptoGateway | null>(null);
  const cryptoProvider = useRef<CryptoPaymentProvider | null>(null);
  const paymentId = useRef<string | null>(null);
  const startedAt = useRef<number>(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const settle = useCallback((result: PaymentResult) => {
    if (!alive.current) return;
    if (paymentCanActivateRegistration(result.status)) {
      setState({ kind: "paid", reference: result.providerPaymentId });
      return;
    }
    if (result.status === "REQUIRES_ACTION") {
      setState({ kind: "action-required" });
      return;
    }
    setState({
      kind: "failed",
      message:
        result.status === "FAILED"
          ? "The payment was declined. Nothing has been charged and nothing is registered."
          : `The payment ended as ${result.status.toLowerCase()}. Nothing is registered.`,
    });
  }, []);

  /** Card: create the intent, then confirm — which is where a second step resolves. */
  const payByCard = useCallback(
    async (cardNumber: string) => {
      setState({ kind: "working" });
      try {
        /* The order exists before the money moves. See `use-registration-order.ts`: a
           payment that succeeds against nothing leaves somebody charged and not entered. */
        const order_ = await order.createOrder();
        if (!order_.ok) {
          if (alive.current) setState({ kind: "failed", message: order_.message });
          return;
        }
        const provider = new StripePaymentProvider(new TestStripeClient(cardNumber));
        const created = await provider.createPayment({
          orderId: order_.orderId,
          amountMinor: order.totalMinor,
          currency: order.currency,
          idempotencyKey: order_.orderId,
        });
        if (created.status === "REQUIRES_ACTION") {
          if (alive.current) setState({ kind: "action-required" });
          settle(await provider.confirmPayment(created.providerPaymentId));
          return;
        }
        settle(created);
      } catch (cause) {
        if (!alive.current) return;
        setState({ kind: "failed", message: messageOf(cause) });
      }
    },
    [order, settle],
  );

  /** Wallet, step one: get a quote and show what to send, where, and by when. */
  const startWalletPayment = useCallback(async () => {
    setState({ kind: "working" });
    try {
      const order_ = await order.createOrder();
      if (!order_.ok) {
        if (alive.current) setState({ kind: "failed", message: order_.message });
        return;
      }
      const gateway = new TestCryptoGateway();
      const provider = new CryptoPaymentProvider(gateway);
      cryptoGateway.current = gateway;
      cryptoProvider.current = provider;

      const created = await provider.createPayment({
        orderId: order_.orderId,
        amountMinor: order.totalMinor,
        currency: order.currency,
        idempotencyKey: order_.orderId,
      });
      paymentId.current = created.providerPaymentId;
      const quote = await gateway.getQuote(created.providerPaymentId.replace(/^crypto:/, ""));
      if (alive.current) setState({ kind: "awaiting-wallet", quote });
    } catch (cause) {
      if (!alive.current) return;
      setState({ kind: "failed", message: messageOf(cause) });
    }
  }, [order]);

  /**
   * Wallet, step two: record the transaction and watch the chain.
   *
   * `registerSubmission` re-checks the chain and the asset against the quote before the
   * watching starts, so a transaction sent on the wrong network fails here rather than
   * being polled forever.
   */
  const submitWalletTransaction = useCallback(
    async (txHash: string, quote: CryptoQuote) => {
      const provider = cryptoProvider.current;
      const gateway = cryptoGateway.current;
      const id = paymentId.current;
      if (!provider || !gateway || !id) return;

      try {
        provider.registerSubmission(id, {
          txHash,
          chainNamespace: quote.chainNamespace,
          chainId: quote.chainId,
          asset: quote.cryptoAsset,
          amountAtomic: quote.cryptoAmountAtomic,
          recipientAddress: quote.recipientAddress,
        });
        gateway.markSubmitted(txHash, quote.quoteId);
        startedAt.current = Date.now();
        if (alive.current) setState({ kind: "confirming", txHash });
      } catch (cause) {
        if (!alive.current) return;
        setState({ kind: "failed", message: messageOf(cause) });
      }
    },
    [],
  );

  /* Poll only while confirming. The effect owns the timer, so leaving the screen stops it
     and there is no interval left running behind a closed checkout. */
  useEffect(() => {
    if (state.kind !== "confirming") return;
    const provider = cryptoProvider.current;
    const id = paymentId.current;
    if (!provider || !id) return;

    let stopped = false;
    const timer = setInterval(() => {
      void (async () => {
        if (stopped) return;
        try {
          const result = await provider.getStatus(id);
          if (stopped) return;
          if (result.status === "PENDING") {
            if (Date.now() - startedAt.current > CONFIRM_TIMEOUT_MS) {
              stopped = true;
              setState({
                kind: "failed",
                message:
                  "The network has not confirmed this yet. Your transaction may still land — check your wallet before paying again.",
              });
            }
            return;
          }
          stopped = true;
          settle(result);
        } catch (cause) {
          if (stopped) return;
          stopped = true;
          setState({ kind: "failed", message: messageOf(cause) });
        }
      })();
    }, POLL_MS);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [state.kind, settle]);

  const reset = useCallback(() => setState({ kind: "idle" }), []);

  return {
    state,
    payByCard,
    startWalletPayment,
    submitWalletTransaction,
    reset,
    /** Whether to offer the wallet option at all — see `hasBrowserWallet`. */
    walletAvailable,
  };
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : "The payment could not be completed.";
}
