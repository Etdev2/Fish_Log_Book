/**
 * The two pieces of ABI encoding a stablecoin payment needs, by hand.
 *
 * By hand because the alternative is a web3 library, and the smallest of those is larger
 * than this entire application's JavaScript budget for a screen most anglers will never
 * open. What we need is one function selector and two 32-byte words. That is forty lines,
 * it has no supply chain, and — being pure string work — it is exhaustively testable, which
 * matters more here than anywhere else in the app: a wrong byte in this file sends
 * somebody's entry fee to the wrong address or for the wrong amount, and on a chain there
 * is no undo.
 *
 * Lives in `lib` rather than `core` only by association with the wallet it feeds; the
 * functions themselves touch nothing but strings.
 */

/** `transfer(address,uint256)` — the first four bytes of its keccak-256 hash. */
export const ERC20_TRANSFER_SELECTOR = "0xa9059cbb";

/*
  Built rather than written as `0n` and `10n`: tsconfig targets ES2017, where BigInt
  literals are a syntax error. Bumping the whole project's target to get nicer notation in
  one file is a change with a much wider blast radius than this costs.
*/
const ZERO = BigInt(0);
const TEN = BigInt(10);

/** Left-pads a hex quantity to a 32-byte ABI word. */
function word(hexWithoutPrefix: string): string {
  const clean = hexWithoutPrefix.toLowerCase().replace(/^0x/, "");
  if (clean.length > 64) throw new Error("value does not fit in a 32-byte word");
  return clean.padStart(64, "0");
}

/** True for a well-formed 20-byte address. Case is not checked — see `encodeTransfer`. */
export function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

/**
 * Calldata for moving `amountAtomic` of a token to `to`.
 *
 * `amountAtomic` is a bigint of the token's smallest unit — 6 decimals for USDC, so
 * 250_000_000n is $250. It is never a float and never a display amount: binary floating
 * point cannot hold `0.1` exactly, and a rounding error here is money.
 */
export function encodeTransfer(to: string, amountAtomic: bigint): string {
  if (!isAddress(to)) throw new Error(`not an address: ${to}`);
  if (amountAtomic <= ZERO) throw new Error("transfer amount must be positive");
  return `${ERC20_TRANSFER_SELECTOR}${word(to.slice(2))}${word(amountAtomic.toString(16))}`;
}

/**
 * A fiat amount in minor units → the token's atomic units.
 *
 * Only sound when the token is a stable one pegged to the quoted currency, which is why
 * ADR 010 §2 prefers a stablecoin: `$250` becoming `250000000` of a USD-pegged token is an
 * exact integer scaling, whereas `$250` becoming an amount of a volatile asset is a
 * conversion at a rate that has to be quoted, recorded and given an expiry. That path goes
 * through `crypto_payment_quote`, not through this function.
 */
export function minorToAtomic(amountMinor: number, tokenDecimals: number): bigint {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error("amount must be a non-negative integer of minor units");
  }
  if (!Number.isInteger(tokenDecimals) || tokenDecimals < 2 || tokenDecimals > 36) {
    throw new Error("implausible token decimals");
  }
  // Minor units are hundredths, so the scale is decimals - 2. Done in bigint throughout:
  // 10 ** 18 is past Number.MAX_SAFE_INTEGER and would silently lose precision.
  return BigInt(amountMinor) * TEN ** BigInt(tokenDecimals - 2);
}
