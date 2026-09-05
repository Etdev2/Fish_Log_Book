export type VerificationResult = "PASS" | "FAIL" | "WARNING" | "UNKNOWN" | "NOT_REQUIRED";

export type VerificationCheckType =
  | "PHOTO_PRESENT"
  | "PHOTO_DUPLICATE"
  | "GPS_BOUNDARY"
  | "GPS_ACCURACY"
  | "TIME_WINDOW"
  | "QR_TOKEN"
  | "ENTRY_ACTIVE"
  | "BOAT_VALID"
  | "MEASUREMENT_PRESENT"
  | "WEIGHT_PRESENT"
  | "DEVICE_METADATA"
  | "WEIGHMASTER_CONFIRMATION";

export interface VerificationCheckInput {
  readonly type: VerificationCheckType;
  readonly result: VerificationResult;
  readonly reasonCode: string;
}

export type FairPlaySignalCode =
  | "QR_EXPIRED"
  | "QR_REUSED"
  | "GPS_OUTSIDE_BOUNDARY"
  | "GPS_LOW_ACCURACY"
  | "PHOTO_DUPLICATE"
  | "TIMESTAMP_MISMATCH"
  | "UNREGISTERED_ENTRY"
  | "DEVICE_TIME_ANOMALY"
  | "MISSING_REQUIRED_EVIDENCE";

export interface FairPlaySignal {
  readonly code: FairPlaySignalCode;
  readonly severity: "INFO" | "WARNING" | "BLOCKING_REVIEW";
  readonly explanation: string;
}

export interface VerificationEvaluation {
  readonly disposition: "CLEAR" | "REVIEW_REQUIRED" | "BLOCKED_BY_POLICY";
  readonly signals: readonly FairPlaySignal[];
}

/**
 * Pure, explainable policy mapping. Checks/signals do not mutate scores or catches.
 * A caller may decide that FAIL is deterministic-blocking for selected check types.
 */
export function evaluateVerification(
  checks: readonly VerificationCheckInput[],
  deterministicBlocks: ReadonlySet<VerificationCheckType> = new Set(),
): VerificationEvaluation {
  const signals: FairPlaySignal[] = [];
  let blocked = false;
  let needsReview = false;

  for (const check of checks) {
    if (check.result === "PASS" || check.result === "NOT_REQUIRED") continue;

    if (check.result === "FAIL" && deterministicBlocks.has(check.type)) {
      blocked = true;
    } else {
      needsReview = true;
    }

    const signal = signalFor(check);
    if (signal) signals.push(signal);
  }

  return {
    disposition: blocked ? "BLOCKED_BY_POLICY" : needsReview ? "REVIEW_REQUIRED" : "CLEAR",
    signals,
  };
}

function signalFor(check: VerificationCheckInput): FairPlaySignal | null {
  const severity = check.result === "FAIL" ? "BLOCKING_REVIEW" : "WARNING";
  switch (check.type) {
    case "QR_TOKEN":
      return { code: check.reasonCode === "QR_REUSED" ? "QR_REUSED" : "QR_EXPIRED", severity, explanation: check.reasonCode };
    case "GPS_BOUNDARY":
      return { code: "GPS_OUTSIDE_BOUNDARY", severity, explanation: check.reasonCode };
    case "GPS_ACCURACY":
      return { code: "GPS_LOW_ACCURACY", severity: "WARNING", explanation: check.reasonCode };
    case "PHOTO_DUPLICATE":
      return { code: "PHOTO_DUPLICATE", severity, explanation: check.reasonCode };
    case "TIME_WINDOW":
      return { code: "TIMESTAMP_MISMATCH", severity, explanation: check.reasonCode };
    case "ENTRY_ACTIVE":
      return { code: "UNREGISTERED_ENTRY", severity, explanation: check.reasonCode };
    case "DEVICE_METADATA":
      return { code: "DEVICE_TIME_ANOMALY", severity: "WARNING", explanation: check.reasonCode };
    case "PHOTO_PRESENT":
    case "MEASUREMENT_PRESENT":
    case "WEIGHT_PRESENT":
      return { code: "MISSING_REQUIRED_EVIDENCE", severity, explanation: check.reasonCode };
    case "BOAT_VALID":
    case "WEIGHMASTER_CONFIRMATION":
      return null;
  }
}
