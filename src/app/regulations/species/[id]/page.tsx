import { SpeciesRulesPage } from "@/features/regulations/components/species-rules-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SpeciesRulesPage speciesId={id} />;
}
