import Link from "next/link";

import { LEGAL_CONTACT, type LegalDocument } from "@/core/legal/documents";

/**
 * Renders one legal document. Long-form reading on a phone, so: a single column capped
 * for line length, generous leading, and headings that survive being skimmed by somebody
 * who is looking for one specific paragraph.
 */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <article className="flex flex-col gap-6">
      <header className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">{document.title}</h1>
        <p className="mt-2 text-body text-text-muted">{document.summary}</p>
        <p className="mt-3 text-caption text-text-muted">Effective {document.effective}</p>
      </header>

      {document.sections.map((section) => (
        <section key={section.heading} className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-body leading-relaxed text-text-primary">
              {paragraph}
            </p>
          ))}
          {section.bullets ? (
            <ul className="mt-3 flex flex-col gap-2">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-body leading-relaxed text-text-primary">
                  <span aria-hidden className="text-text-muted">
                    —
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <ContactFooter />
    </article>
  );
}

/**
 * Who to write to, and under whose law. Renders the gap honestly when the founder has
 * not filled it in yet, rather than printing a plausible-looking address that nobody
 * reads — the same stance the conditions code takes with "No verified data".
 */
function ContactFooter() {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h2 className="text-h3">Contact</h2>
      {LEGAL_CONTACT.resolved ? (
        <p className="mt-3 text-body text-text-primary">
          Questions about these terms, your data, or a rule you think is wrong go to{" "}
          <a
            href={`mailto:${LEGAL_CONTACT.email}`}
            className="text-text-link underline decoration-dotted underline-offset-2"
          >
            {LEGAL_CONTACT.email}
          </a>
          . These terms are governed by the laws of {LEGAL_CONTACT.jurisdiction}.
        </p>
      ) : (
        <p
          role="note"
          className="mt-3 rounded-md border border-amber-flag p-3 text-body text-amber-flag"
        >
          A contact address has not been published yet. Until it is, these documents are
          incomplete and this app is not ready to be offered to the public.
        </p>
      )}
      <p className="mt-3 text-caption text-text-muted">
        Also read:{" "}
        <Link href="/legal" className="text-text-link underline decoration-dotted underline-offset-2">
          the other notices
        </Link>
        .
      </p>
    </section>
  );
}
