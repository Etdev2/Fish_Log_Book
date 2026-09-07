"use client";

import type { PaymentRequest } from "@/core/tournaments/payments";
import type {
  ChainObservation,
  CryptoGatewayPort,
  CryptoQuote,
} from "@/core/tournaments/crypto-provider";
import type {
  StripeClientPort,
  StripePaymentIntentLike,
  StripeRefundLike,
} from "@/core/tournaments/stripe-provider";

/**
 * Test-mode gateways: the real provider state machines, with nothing real behind them.
 *
 * ADR 010 §3 — the live payment path ships behind a provider that must be configured, and
 * the default configuration is a test one. No key that can move money exists in this
 * repository, and these two classes are what stands in until one does.
 *
 * They implement the same ports the live gateways will (`StripeClientPort`,
 * `CryptoGatewayPort`), which is the point: the checkout above them drives
 * `StripePaymentProvider` and `CryptoPaymentProvider` for real, including
 * `evaluateObservation`'s chain / asset / recipient / amount checks. What gets exercised is
 * the actual payment logic, not a mock of it, so the day a live gateway is dropped in the
 * only thing that changes is which object is constructed.
 *
 * Everything below is deliberately obvious about being fake — the addresses are the
 * documented burn address, the card rules are Stripe's published test numbers, and the
 * confirmations tick on a timer.
 */

/** Stripe's published test cards, so the failure paths are reachable on purpose. */
export const TEST_CARDS = {
  success: "4242 4242 4242 4242",
  declined: "4000 0000 0000 0002",
  requiresAction: "4000 0025 0000 3155",
} as const;

const digitsOf = (value: string) => value.replace(/\D/g, "");

export class TestStripeClient implements StripeClientPort {
  private readonly intents = new Map<string, StripePaymentIntentLike>();

  constructor(private readonly cardNumber: string) {}

  async createPaymentIntent(input: {
    amount: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<StripePaymentIntentLike> {
    await settle();
    const card = digitsOf(this.cardNumber);
    const status: StripePaymentIntentLike["status"] =
      card === digitsOf(TEST_CARDS.declined)
        ? "canceled"
        : card === digitsOf(TEST_CARDS.requiresAction)
          ? "requires_action"
          : "succeeded";

    const intent: StripePaymentIntentLike = {
      id: `pi_test_${input.idempotencyKey}`,
      status,
      amount: input.amount,
      currency: input.currency.toLowerCase(),
      client_secret: null,
    };
    this.intents.set(intent.id, intent);
    return intent;
  }

  async retrievePaymentIntent(id: string): Promise<StripePaymentIntentLike> {
    await settle();
    const intent = this.intents.get(id);
    if (!intent) throw new Error("unknown test payment intent");
    /* The "requires action" card succeeds on the second look — that is what completing the
       3-D Secure step looks like from here, and it is the state the screen has to handle. */
    if (intent.status === "requires_action") {
      const advanced = { ...intent, status: "succeeded" as const };
      this.intents.set(id, advanced);
      return advanced;
    }
    return intent;
  }

  async createRefund(): Promise<StripeRefundLike> {
    await settle();
    return { id: "re_test", amount: 0, status: "succeeded" };
  }
}

/**
 * The Ethereum burn address, used as the test recipient.
 *
 * Chosen because it is unmistakable in a screenshot and because nothing in test mode ever
 * sends to it: `TestCryptoGateway` observes a transaction it invents. A plausible-looking
 * random address would risk somebody pasting it into a real wallet.
 */
export const TEST_RECIPIENT = "0x000000000000000000000000000000000000dEaD";

/** Base Sepolia — a test network, so an accidentally live wallet cannot lose real money. */
export const TEST_CHAIN_ID_HEX = "0x14a34";

export class TestCryptoGateway implements CryptoGatewayPort {
  private readonly quotes = new Map<string, CryptoQuote>();
  private readonly submitted = new Map<string, { quoteId: string; at: number }>();

  constructor(private readonly confirmAfterMs = 4000) {}

  async createQuote(request: PaymentRequest): Promise<CryptoQuote> {
    await settle();
    const quoteId = `q_${request.idempotencyKey}`;
    const quote: CryptoQuote = {
      quoteId,
      fiatCurrency: request.currency.toUpperCase(),
      fiatAmountMinor: request.amountMinor,
      cryptoAsset: "USDC",
      /* A USD-pegged token, so minor units scale exactly to six decimals and no exchange
         rate is invented. ADR 010 §2: prices are quoted in fiat, always. */
      cryptoAmountAtomic: String(request.amountMinor * 10_000),
      chainNamespace: "eip155",
      chainId: TEST_CHAIN_ID_HEX,
      recipientAddress: TEST_RECIPIENT,
      /* Ten minutes. Long enough to open a wallet and read the screen, short enough that a
         quote left on a table overnight is not honoured at yesterday's rate. */
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    };
    this.quotes.set(quoteId, quote);
    return quote;
  }

  async getQuote(quoteId: string): Promise<CryptoQuote> {
    const quote = this.quotes.get(quoteId);
    if (!quote) throw new Error("unknown quote");
    return quote;
  }

  /** Called by the screen when the "wallet" has sent, so observations can start. */
  markSubmitted(txHash: string, quoteId: string): void {
    this.submitted.set(txHash, { quoteId, at: Date.now() });
  }

  async observeTransaction(txHash: string): Promise<ChainObservation> {
    await settle();
    const record = this.submitted.get(txHash);
    if (!record) throw new Error("unknown transaction");
    const quote = this.quotes.get(record.quoteId);
    if (!quote) throw new Error("unknown quote");

    /* Confirmations arrive on a timer, so the screen's "waiting on the network" state is a
       state somebody actually sees rather than a frame that flashes past. A payment that
       resolved instantly would let an optimistic UI ship undetected. */
    const elapsed = Date.now() - record.at;
    const final = elapsed >= this.confirmAfterMs;
    return {
      txHash,
      chainId: quote.chainId,
      asset: quote.cryptoAsset,
      amountAtomic: quote.cryptoAmountAtomic,
      recipientAddress: quote.recipientAddress,
      confirmations: final ? 1 : 0,
      final,
    };
  }
}

/** A beat, so the screens have to handle "in flight" rather than resolving synchronously. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 350));
}
