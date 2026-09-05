"use client";

import Link from "next/link";

import { LEGAL_VERSION } from "@/core/legal/documents";
import { acceptCurrentLegal, useLegalAcknowledgement } from "../acknowledgement";

/**
 * The one-time acknowledgement, shown at the top of Fish Legal until it is accepted.
 *
 * It does NOT block the section. A modal gate over a page somebody opened to check
 * whether a fish is legal is the wrong trade: it puts a tap between an angler and a rule
 * they are trying to obey, on a boat, and the thing it protects against is better served
 * by the permanent notice on every answer screen. This asks once, records which version
 * was accepted, and then gets out of the way for good.
 */
export function LegalAcknowledgement() {
  const [accepted] = useLegalAcknowledgement();
  if (accepted === LEGAL_VERSION) return null;

  const returning = accepted !== null;

  return (
    <section
      aria-labelledby="legal-ack-heading"
      className="rounded-lg border border-amber-flag bg-surface p-4"
    >
      <h2 id="legal-ack-heading" className="text-h3 text-amber-flag">
        {returning ? "These notices have changed" : "Before you rely on this"}
      </h2>
      <p className="mt-2 text-body text-text-primary">
        Fish Legal is a reading aid built from published regulations — it is not the law,
        and it is not legal advice. Rules change in season, sometimes the same day.
        Check the agency&apos;s own publication, linked on every rule, before you keep a fish.
      </p>
      <p className="mt-2 text-body text-text-primary">
        Fishing legally is your responsibility, including identifying what you caught.
      </p>
      <p className="mt-3 text-caption text-text-muted">
        Full detail in{" "}
        <Link
          href="/legal/regulations"
          className="text-text-link underline decoration-dotted underline-offset-2"
        >
          About the fishing rules
        </Link>
        ,{" "}
        <Link
          href="/legal/terms"
          className="text-text-link underline decoration-dotted underline-offset-2"
        >
          Terms of Use
        </Link>{" "}
        and the{" "}
        <Link
          href="/legal/privacy"
          className="text-text-link underline decoration-dotted underline-offset-2"
        >
          Privacy Notice
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={acceptCurrentLegal}
        className="mt-4 inline-flex min-h-touch-primary-standard items-center justify-center rounded-md bg-signal-orange px-4 text-label text-ink-on-orange transition-colors active:scale-95 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring motion-reduce:transition-none"
      >
        I understand
      </button>
    </section>
  );
}
