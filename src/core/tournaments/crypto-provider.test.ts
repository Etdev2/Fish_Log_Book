import { describe, expect, it, vi } from "vitest";

import {
  CryptoPaymentProvider,
  evaluateObservation,
  validateQuote,
  type CryptoGatewayPort,
  type CryptoQuote,
} from "./crypto-provider";

const quote: CryptoQuote = {
  quoteId: "q1",
  fiatCurrency: "USD",
  fiatAmountMinor: 5000,
  cryptoAsset: "USDC",
  cryptoAmountAtomic: "50000000",
  chainNamespace: "eip155",
  chainId: "8453",
  recipientAddress: "0xabc",
  expiresAt: "2030-01-01T00:00:00.000Z",
};

function gateway(): CryptoGatewayPort {
  return {
    createQuote: vi.fn(async () => quote),
    getQuote: vi.fn(async () => quote),
    observeTransaction: vi.fn(async (txHash) => ({
      txHash,
      chainId: "8453",
      asset: "USDC",
      amountAtomic: "50000000",
      recipientAddress: "0xabc",
      confirmations: 3,
      final: true,
    })),
  };
}

describe("crypto payment safety", () => {
  it("rejects expired quotes", () => {
    expect(() => validateQuote({ ...quote, expiresAt: "2020-01-01T00:00:00.000Z" }, Date.now())).toThrow("expired");
  });

  it("does not treat a transaction submission as confirmation", async () => {
    const provider = new CryptoPaymentProvider(gateway(), 2, () => Date.parse("2029-01-01T00:00:00.000Z"));
    const payment = await provider.createPayment({ orderId: "o1", amountMinor: 5000, currency: "USD", idempotencyKey: "i1" });
    provider.registerSubmission(payment.providerPaymentId, {
      txHash: "0xtx",
      chainNamespace: "eip155",
      chainId: "8453",
      asset: "USDC",
      amountAtomic: "50000000",
      recipientAddress: "0xabc",
    });
    expect(payment.status).toBe("PENDING");
    expect((await provider.getStatus(payment.providerPaymentId)).status).toBe("CONFIRMED");
  });

  it("rejects the wrong network before observation", async () => {
    const provider = new CryptoPaymentProvider(gateway(), 1, () => Date.parse("2029-01-01T00:00:00.000Z"));
    const payment = await provider.createPayment({ orderId: "o1", amountMinor: 5000, currency: "USD", idempotencyKey: "i2" });
    expect(() => provider.registerSubmission(payment.providerPaymentId, {
      txHash: "0xtx",
      chainNamespace: "eip155",
      chainId: "1",
      asset: "USDC",
      amountAtomic: "50000000",
      recipientAddress: "0xabc",
    })).toThrow("wrong crypto network");
  });

  it("requires server-observed finality and confirmations", () => {
    expect(evaluateObservation(quote, {
      txHash: "0xtx",
      chainId: "8453",
      asset: "USDC",
      amountAtomic: "50000000",
      recipientAddress: "0xabc",
      confirmations: 1,
      final: false,
    }, 2)).toBe("PENDING");
  });

  it("rejects underpayment and wrong asset", () => {
    expect(evaluateObservation(quote, {
      txHash: "0xtx",
      chainId: "8453",
      asset: "USDC",
      amountAtomic: "49999999",
      recipientAddress: "0xabc",
      confirmations: 3,
      final: true,
    }, 2)).toBe("FAILED");

    expect(evaluateObservation(quote, {
      txHash: "0xtx",
      chainId: "8453",
      asset: "ETH",
      amountAtomic: "50000000",
      recipientAddress: "0xabc",
      confirmations: 3,
      final: true,
    }, 2)).toBe("FAILED");
  });

  it("does not imply crypto payouts are enabled", async () => {
    const provider = new CryptoPaymentProvider(gateway(), 1, () => Date.parse("2029-01-01T00:00:00.000Z"));
    await expect(provider.refund({ providerPaymentId: "x", amountMinor: 100, idempotencyKey: "r1" })).rejects.toThrow("not enabled");
  });
});
