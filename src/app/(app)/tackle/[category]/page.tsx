import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TackleCategoryView } from "@/features/tackle/components/tackle-category-view";
import { TACKLE_CATEGORIES } from "@/features/tackle/types";

// The registry is the whole URL space: one prerendered page per category, and any
// other segment 404s (dynamicParams = false).
export function generateStaticParams() {
  return TACKLE_CATEGORIES.map((category) => ({ category: category.id }));
}

export const dynamicParams = false;

type Params = Promise<{ category: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  const spec = TACKLE_CATEGORIES.find((candidate) => candidate.id === category);
  return {
    title: `${spec?.label ?? "Category"} | Fish Log Book`,
    description: "A personal, session-only tackle inventory for the Fish Log Book prototype.",
  };
}

export default async function TackleCategoryPage({ params }: { params: Params }) {
  const { category } = await params;
  const spec = TACKLE_CATEGORIES.find((candidate) => candidate.id === category);
  if (!spec) notFound();
  return <TackleCategoryView category={spec.id} />;
}
