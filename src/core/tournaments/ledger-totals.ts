/** An exact database total, after validating the range the money UI can display. */
export interface TournamentMoney {
  readonly currency: string | null;
  readonly collectedMinor: number;
  readonly outstandingMinor: number;
  readonly paidOrders: number;
  readonly unpaidOrders: number;
  readonly refundedOrders: number;
}

function safeInteger(value: unknown): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error("The ledger returned an invalid amount or count.");
  }
  const exact = BigInt(value);
  if (exact > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("The ledger total is too large to display exactly.");
  }
  return Number(exact);
}

/** SQL returns text for every integer so JSON number parsing cannot round it first. */
export function parseTournamentMoneyTotals(value: unknown): TournamentMoney {
  if (value === null || typeof value !== "object") {
    throw new Error("The ledger totals could not be read.");
  }
  const row = value as Record<string, unknown>;
  if (row.currency !== null && (typeof row.currency !== "string" || !/^[A-Z]{3}$/.test(row.currency))) {
    throw new Error("The ledger returned an invalid currency.");
  }
  return {
    currency: row.currency,
    collectedMinor: safeInteger(row.collected_minor),
    outstandingMinor: safeInteger(row.outstanding_minor),
    paidOrders: safeInteger(row.paid_orders),
    unpaidOrders: safeInteger(row.unpaid_orders),
    refundedOrders: safeInteger(row.refunded_orders),
  };
}
