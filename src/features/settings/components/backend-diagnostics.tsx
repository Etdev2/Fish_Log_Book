"use client";

import { useEffect, useState } from "react";

import { checkBackend, type Diagnostics } from "../queries/diagnostics";

/**
 * The connection check that used to be the whole home page. It lives here now, next to the
 * backup state an angler might actually want to look at on a boat (ADR 005 §4).
 */
export function BackendDiagnostics() {
  const [result, setResult] = useState<Diagnostics | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkBackend().then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dot =
    result === null
      ? "bg-text-muted"
      : result.kind === "reachable"
        ? "bg-success-green"
        : result.kind === "unconfigured"
          ? "bg-amber-flag"
          : "bg-error-red";

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h2 className="text-h3">Diagnostics</h2>
      <p className="mt-3 flex items-center gap-2 text-body">
        <span className={`size-3 rounded-full ${dot}`} aria-hidden="true" />
        {result === null ? "Checking the backend…" : result.detail}
      </p>
    </section>
  );
}
