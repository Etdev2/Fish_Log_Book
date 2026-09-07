"use client";

import { encodeTransfer, isAddress, minorToAtomic } from "./erc20";

/**
 * The browser wallet, behind one small surface.
 *
 * Any EIP-1193 provider — MetaMask, Rabby, Coinbase Wallet, a wallet built into a browser.
 * The founder's brief says the plug-in does not matter, and the standard is what makes that
 * true: every one of them answers the same `request({ method, params })`. Nothing in here
 * names MetaMask except the copy that helps somebody who has none installed.
 *
 * It lives in `lib` because it talks to a browser API, per ADR 005 §3. Everything it
 * returns is inert data, so the payment rules above it stay pure and testable.
 *
 * What this deliberately does NOT do: decide whether a payment succeeded. It hands back a
 * transaction hash, which is a promise, not a receipt. Only an on-chain observation at the
 * required confirmation count settles an order — see `crypto-provider.ts` and ADR 010 §2.
 */

/** The EIP-1193 shape, written out rather than pulled from a package for four methods. */
interface Eip1193Provider {
  request(args: { method: string; params?: readonly unknown[] | object }): Promise<unknown>;
  on?(event: string, handler: (...args: never[]) => void): void;
  removeListener?(event: string, handler: (...args: never[]) => void): void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export interface WalletConnection {
  readonly address: string;
  /** EIP-155 chain id in hex, as the provider reports it (`0x1`, `0xa4b1`, …). */
  readonly chainIdHex: string;
}

/** The errors a person can actually do something about, separated from the ones they cannot. */
export type WalletError =
  | { readonly kind: "no-wallet" }
  | { readonly kind: "rejected" }
  | { readonly kind: "wrong-network"; readonly expected: string; readonly actual: string }
  | { readonly kind: "failed"; readonly message: string };

export class WalletFailure extends Error {
  constructor(readonly detail: WalletError) {
    super(detail.kind);
    this.name = "WalletFailure";
  }
}

/** EIP-1193 rejection. 4001 is the code every wallet uses for "the person said no". */
function isUserRejection(cause: unknown): boolean {
  return typeof cause === "object" && cause !== null && (cause as { code?: number }).code === 4001;
}

function provider(): Eip1193Provider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new WalletFailure({ kind: "no-wallet" });
  }
  return window.ethereum;
}

/** Whether there is a wallet to talk to at all, for deciding whether to offer the option. */
export function hasBrowserWallet(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

/**
 * Ask for an account. This is the step that opens the wallet's own prompt.
 *
 * Deliberately never called on mount: a page that pops a wallet dialog the moment it loads
 * is the behaviour that teaches people to dismiss wallet dialogs without reading them.
 */
export async function connectWallet(): Promise<WalletConnection> {
  const eth = provider();
  try {
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    const address = accounts?.[0];
    if (!address || !isAddress(address)) {
      throw new WalletFailure({ kind: "failed", message: "The wallet returned no account." });
    }
    const chainIdHex = (await eth.request({ method: "eth_chainId" })) as string;
    return { address, chainIdHex };
  } catch (cause) {
    throw asFailure(cause);
  }
}

/**
 * Move the wallet to the chain the quote was priced on.
 *
 * The quote names a chain, and paying on a different one sends real money somewhere the
 * event will never look. `evaluateObservation` would reject it afterwards, but rejecting a
 * payment after it is on-chain is not a fix — the money is gone. So the switch happens
 * first, and a refusal to switch stops the payment.
 */
export async function ensureChain(expectedChainIdHex: string): Promise<void> {
  const eth = provider();
  const current = (await eth.request({ method: "eth_chainId" })) as string;
  if (current.toLowerCase() === expectedChainIdHex.toLowerCase()) return;

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: expectedChainIdHex }],
    });
  } catch (cause) {
    if (isUserRejection(cause)) throw new WalletFailure({ kind: "rejected" });
    throw new WalletFailure({
      kind: "wrong-network",
      expected: expectedChainIdHex,
      actual: current,
    });
  }

  // Trust the confirmation, not the request: some wallets resolve the switch and then do
  // not switch. Paying on the wrong chain is unrecoverable, so this is checked, not assumed.
  const after = (await eth.request({ method: "eth_chainId" })) as string;
  if (after.toLowerCase() !== expectedChainIdHex.toLowerCase()) {
    throw new WalletFailure({ kind: "wrong-network", expected: expectedChainIdHex, actual: after });
  }
}

export interface TokenPaymentRequest {
  readonly from: string;
  /** The event's receiving address, from the quote. */
  readonly to: string;
  /** The token contract. */
  readonly tokenAddress: string;
  readonly tokenDecimals: number;
  readonly amountMinor: number;
  readonly chainIdHex: string;
}

/**
 * Send a stablecoin transfer and return its transaction hash.
 *
 * The hash is where this function's responsibility ends. The order is not paid until the
 * transfer is observed on-chain at the required confirmations.
 */
export async function payWithToken(request: TokenPaymentRequest): Promise<string> {
  const eth = provider();
  await ensureChain(request.chainIdHex);

  const data = encodeTransfer(request.to, minorToAtomic(request.amountMinor, request.tokenDecimals));

  try {
    const txHash = (await eth.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: request.from,
          // An ERC-20 transfer is a call to the TOKEN contract, and carries no ether:
          // sending to the recipient address instead would move native currency and leave
          // the stablecoin where it was.
          to: request.tokenAddress,
          value: "0x0",
          data,
        },
      ],
    })) as string;

    if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      throw new WalletFailure({ kind: "failed", message: "The wallet returned no transaction." });
    }
    return txHash;
  } catch (cause) {
    throw asFailure(cause);
  }
}

function asFailure(cause: unknown): WalletFailure {
  if (cause instanceof WalletFailure) return cause;
  if (isUserRejection(cause)) return new WalletFailure({ kind: "rejected" });
  return new WalletFailure({
    kind: "failed",
    message: cause instanceof Error ? cause.message : "The wallet could not complete this.",
  });
}
