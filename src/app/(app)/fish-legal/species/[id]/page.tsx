import { SpeciesRulesPage } from "@/features/fish-legal/components/species-rules-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SpeciesRulesPage speciesId={id} />;
}
