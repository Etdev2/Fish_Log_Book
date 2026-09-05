import type { PaymentProvider, PaymentRequest, PaymentResult, RefundRequest, RefundResult } from "./payments";

export interface CryptoQuote {
  quoteId: string;
  fiatCurrency: string;
  fiatAmountMinor: number;
  cryptoAsset: string;
  cryptoAmountAtomic: string;
  chainNamespace: string;
  chainId: string;
  recipientAddress: string;
  expiresAt: string;
}

export interface CryptoSubmission {
  txHash: string;
  chainNamespace: string;
  chainId: string;
  asset: string;
  amountAtomic: string;
  recipientAddress: string;
}

export interface ChainObservation {
  txHash: string;
  chainId: string;
  asset: string;
  amountAtomic: string;
  recipientAddress: string;
  confirmations: number;
  final: boolean;
  failed?: boolean;
}

export interface CryptoGatewayPort {
  createQuote(request: PaymentRequest): Promise<CryptoQuote>;
  getQuote(quoteId: string): Promise<CryptoQuote>;
  observeTransaction(txHash: string, chainId: string): Promise<ChainObservation>;
  createRefundInstruction?(request: RefundRequest): Promise<RefundResult>;
}

export interface CryptoPaymentState {
  providerPaymentId: string;
  quote: CryptoQuote;
  submission?: CryptoSubmission;
}

export function validateQuote(quote: CryptoQuote, nowMs: number): void {
  if (Date.parse(quote.expiresAt) <= nowMs) throw new Error("crypto quote expired");
  if (!quote.chainNamespace || !quote.chainId || !quote.cryptoAsset) throw new Error("crypto quote missing network or asset");
  if (!quote.recipientAddress) throw new Error("crypto quote missing recipient");
}

export function evaluateObservation(
  quote: CryptoQuote,
  observation: ChainObservation,
  requiredConfirmations: number,
): PaymentResult["status"] {
  if (observation.failed) return "FAILED";
  if (observation.chainId !== quote.chainId) return "FAILED";
  if (observation.asset.toLowerCase() !== quote.cryptoAsset.toLowerCase()) return "FAILED";
  if (observation.recipientAddress.toLowerCase() !== quote.recipientAddress.toLowerCase()) return "FAILED";
  if (BigInt(observation.amountAtomic) < BigInt(quote.cryptoAmountAtomic)) return "FAILED";
  if (!observation.final || observation.confirmations < requiredConfirmations) return "PENDING";
  return "CONFIRMED";
}

export class CryptoPaymentProvider implements PaymentProvider {
  readonly name = "crypto";
  private readonly states = new Map<string, CryptoPaymentState>();

  constructor(
    private readonly gateway: CryptoGatewayPort,
    private readonly requiredConfirmations = 1,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    const quote = await this.gateway.createQuote(request);
    validateQuote(quote, this.now());
    const id = `crypto:${quote.quoteId}`;
    this.states.set(id, { providerPaymentId: id, quote });
    return {
      provider: this.name,
      providerPaymentId: id,
      status: "PENDING",
      amountMinor: request.amountMinor,
      currency: request.currency.toUpperCase(),
    };
  }

  registerSubmission(providerPaymentId: string, submission: CryptoSubmission): void {
    const state = this.states.get(providerPaymentId);
    if (!state) throw new Error("unknown crypto payment");
    if (submission.chainId !== state.quote.chainId) throw new Error("wrong crypto network");
    if (submission.asset.toLowerCase() !== state.quote.cryptoAsset.toLowerCase()) throw new Error("wrong crypto asset");
    state.submission = submission;
  }

  async confirmPayment(providerPaymentId: string): Promise<PaymentResult> {
    return this.getStatus(providerPaymentId);
  }

  async getStatus(providerPaymentId: string): Promise<PaymentResult> {
    const state = this.states.get(providerPaymentId);
    if (!state) throw new Error("unknown crypto payment");
    validateQuote(state.quote, state.submission ? Date.parse(state.quote.expiresAt) - 1 : this.now());
    if (!state.submission) return this.result(state, "PENDING");
    const observation = await this.gateway.observeTransaction(state.submission.txHash, state.submission.chainId);
    return this.result(state, evaluateObservation(state.quote, observation, this.requiredConfirmations));
  }

  async refund(request: RefundRequest): Promise<RefundResult> {
    if (!this.gateway.createRefundInstruction) throw new Error("crypto refunds are not enabled for this provider");
    return this.gateway.createRefundInstruction(request);
  }

  private result(state: CryptoPaymentState, status: PaymentResult["status"]): PaymentResult {
    return {
      provider: this.name,
      providerPaymentId: state.providerPaymentId,
      status,
      amountMinor: state.quote.fiatAmountMinor,
      currency: state.quote.fiatCurrency.toUpperCase(),
    };
  }
}
