import Link from "next/link";

/**
 * The one-line disclaimer that sits on every screen giving an answer somebody could act
 * on. Shared by fish-legal, fish-id and fin-id, so it lives here rather than in any one
 * of them (ADR 005 §3, promotion rule).
 *
 * Deliberately not a dismissible banner. A disclaimer you can turn off is a disclaimer
 * that is absent the one time it mattered, and it stops being evidence that the warning
 * was on screen. It is quiet instead: caption weight, muted, out of the way of the
 * answer — present without shouting on every visit.
 */
export type LegalNoticeKind = "regulations" | "identification" | "wildlife";

const NOTICE: Record<LegalNoticeKind, { lead: string; body: string }> = {
  regulations: {
    lead: "Not the official rules.",
    body:
      "This is a reading aid built from published regulations, and rules change in season. " +
      "Check the agency's own publication before you keep a fish.",
  },
  identification: {
    lead: "A likelihood, not a verdict.",
    body:
      "These questions narrow the field; they do not confirm a species. Identifying your " +
      "catch, and the limits that follow from it, is your responsibility.",
  },
  wildlife: {
    lead: "Informational, not the law.",
    body:
      "Marine mammals are federally protected, and local rules can be stricter than the " +
      "distances shown. Follow NOAA Fisheries and your local authority.",
  },
};

export function LegalNotice({ kind }: { kind: LegalNoticeKind }) {
  const { lead, body } = NOTICE[kind];
  return (
    <p className="text-caption text-text-muted">
      <strong className="font-semibold text-text-primary">{lead}</strong> {body}{" "}
      <Link
        href="/legal/regulations"
        className="text-text-link underline decoration-dotted underline-offset-2"
      >
        Why, and what to check
      </Link>
      .
    </p>
  );
}
