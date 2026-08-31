export type WaterClass = "salt" | "fresh" | "both";

export type TackleFilter = "all" | "salt" | "fresh";

export type TackleItem = {
  id: string;
  label: string;
  lureClass: string;
  waterClass: WaterClass;
  color?: string;
  sizeLabel?: string;
  isFavorite: boolean;
};

export type TackleDraft = Omit<TackleItem, "id">;

export const FILTER_LABELS: Record<TackleFilter, string> = {
  all: "All",
  salt: "Salt",
  fresh: "Fresh",
};

export const LURE_CLASSES = [
  { label: "Swimbait (soft plastic)", waterClass: "both" },
  { label: "Plastic grub", waterClass: "both" },
  { label: "Plastic worm", waterClass: "fresh" },
  { label: "Jerkbait (hard)", waterClass: "both" },
  { label: "Crankbait", waterClass: "both" },
  { label: "Topwater walker", waterClass: "both" },
  { label: "Popper", waterClass: "both" },
  { label: "Surface iron", waterClass: "salt" },
  { label: "Yo-yo iron", waterClass: "salt" },
  { label: "Lead-head jig", waterClass: "both" },
  { label: "Bucktail jig", waterClass: "both" },
  { label: "Spoon", waterClass: "both" },
  { label: "Sabiki", waterClass: "salt" },
  { label: "Fly", waterClass: "both" },
  { label: "Trolled plug", waterClass: "salt" },
  { label: "Spinnerbait", waterClass: "fresh" },
  { label: "Carolina rig", waterClass: "fresh" },
  { label: "Dropper loop rig", waterClass: "salt" },
] as const satisfies ReadonlyArray<{ label: string; waterClass: WaterClass }>;

export function itemMatchesFilter(item: TackleItem, filter: TackleFilter, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchesWater = filter === "all" || item.waterClass === "both" || item.waterClass === filter;
  const searchText = [item.label, item.lureClass, item.color, item.sizeLabel]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

  return matchesWater && searchText.includes(normalizedQuery);
}
