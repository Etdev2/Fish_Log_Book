import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LEGAL_DOCUMENTS, legalDocument } from "@/core/legal/documents";
import { LegalDocumentView } from "@/features/legal/components/legal-document-view";

/** Three known documents, so they prerender rather than resolving per request. */
export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const doc = legalDocument((await params).slug);
  if (!doc) return { title: "Notices | Fish Log Book" };
  return { title: `${doc.title} | Fish Log Book`, description: doc.summary };
}

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const doc = legalDocument((await params).slug);
  if (!doc) notFound();
  return <LegalDocumentView document={doc} />;
}
