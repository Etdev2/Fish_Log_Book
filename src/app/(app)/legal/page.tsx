import type { Metadata } from "next";
import Link from "next/link";

import { LEGAL_DOCUMENTS, LEGAL_VERSION } from "@/core/legal/documents";

export const metadata: Metadata = {
  title: "Notices | Fish Log Book",
  description: "Terms of use, privacy, and how to read the fishing rules in this app.",
};

export default function LegalIndexPage() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">Notices</h1>
        <p className="mt-2 text-body text-text-muted">
          What this app is, what it is not, and what happens to your log. Current as of{" "}
          {LEGAL_VERSION}.
        </p>
      </section>

      <nav aria-label="Legal documents" className="flex flex-col gap-3">
        {LEGAL_DOCUMENTS.map((doc) => (
          <Link
            key={doc.slug}
            href={`/legal/${doc.slug}`}
            className="rounded-lg border border-hairline bg-surface p-4 transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none"
          >
            <span className="text-h3 text-text-link">{doc.title}</span>
            <span className="mt-1 block text-body text-text-muted">{doc.summary}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
