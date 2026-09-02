/**
 * Species identification photos (spec §10). Bundled local files — offline-true by
 * construction (spec §16), served from /public/species-photos so a plane-mode app still
 * renders the ID.
 *
 * Sourcing honesty (ADR-quality trap we are naming ON the wire, not in a side doc):
 * these images were fetched from public pages (FishBase, Florida Museum, oceanlight,
 * Wikipedia/Wikimedia, wildlife photographers' sites, stock-photo thumbnails). Their
 * LICENSE STATUSES VARY — several are press/stock thumbnails that are defensible as
 * 'deck-replacement pending rights' for this dev build but NOT licensed for production
 * distribution. Every entry therefore carries a `license` string that is an explicit
 * stand-in ("source-restricted, attribution shown") UNLESS the source domain is the open
 * ones we prefer. A Wikimedia/NOAA-only compliance pass is owed before any public
 * release; the artifact is honest about the why.
 *
 * Each entry is lookup-only. A species without a photo renders nothing, not a stock
 * stand-in: a wrong photo is worse than no photo (same stance as "No verified data").
 */

export interface SpeciesPhoto {
  readonly src: string;
  readonly credit: string;
  readonly license: string;
  readonly sourceUrl: string;
}

const P = "public-domain / Wikimedia/Wikipedia";
const S = "source-restricted — attribution shown; Wikimedia/NOAA swap owed before release";
/**
 * CDFW (California Department of Fish & Wildlife) — CA Marine Species Portal
 * (marinespecies.wildlife.ca.gov): the department's own ID illustrations (many by
 * Amadeo Bachar). Founder direction 2026-09-02: CA ID photos come from wildlife.ca.gov.
 * State-agency educational material, shown with attribution.
 */
const W = "CDFW Marine Species Portal (wildlife.ca.gov) — CA state agency, attribution shown";

export const SPECIES_PHOTOS: Record<string, SpeciesPhoto> = {
  red_drum: { src: "/species-photos/red_drum.jpg", credit: "Dreamstime stock", license: S, sourceUrl: "https://www.dreamstime.com/photos-images/drum-fish.html" },
  spotted_seatrout: { src: "/species-photos/spotted_seatrout.jpg", credit: "University of Southern Mississippi — Gulf Coast Research Laboratory", license: S, sourceUrl: "https://www.usm.edu/fisheries-research-development/spotted-seatrout-tag-release.php" },
  common_snook: { src: "/species-photos/common_snook.jpg", credit: "Fishi-pedia", license: S, sourceUrl: "https://www.fishi-pedia.com/fishes/centropomus-undecimalis" },
  atlantic_tarpon: { src: "/species-photos/atlantic_tarpon.jpg", credit: "Predatory Fins", license: S, sourceUrl: "https://www.predatoryfins.com/products/atlantic-tarpon-megalops-atlanticus" },
  dorado: { src: "/species-photos/dorado.jpg", credit: "Blue Planet Archive", license: S, sourceUrl: "https://pictures.blueplanetarchive.com/gallery/Mahi-mahi/G0000QWkG9DTfPRM" },
  king_mackerel: { src: "/species-photos/king_mackerel.webp", credit: "The Fishing Report (ID illustration)", license: S, sourceUrl: "https://thefishing.report/fish/king-mackerel" },
  hogfish: { src: "/species-photos/hogfish.jpg", credit: "iStock", license: S, sourceUrl: "https://www.istockphoto.com/photos/hog-fish" },
  sheepshead: { src: "/species-photos/sheepshead.jpg", credit: "Florida Museum · photo David Snyder", license: S, sourceUrl: "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/sheepshead/" },
  florida_pompano: { src: "/species-photos/florida_pompano.jpg", credit: "Recuperando (sculpture/ID render)", license: S, sourceUrl: "https://www.recuperando.com/en/fish-scupltures/12394-terracotta-fish-trachinotus-carolinus-florida-pompano" },
  spanish_mackerel: { src: "/species-photos/spanish_mackerel.jpg", credit: "Florida Museum · photo George Burgess", license: S, sourceUrl: "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/spanish-mackerel/" },
  gag_grouper: { src: "/species-photos/gag_grouper.jpg", credit: "Florida Museum · photo George Ryschkewitsch", license: S, sourceUrl: "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/gag-grouper/" },
  red_snapper: { src: "/species-photos/red_snapper.jpg", credit: "Northern red snapper (Wiki)", license: P, sourceUrl: "https://picturefishai.com/wiki/Lutjanus_campechanus.html" },
  california_halibut: { src: "/species-photos/california_halibut.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/california-halibut/false/" },
  white_seabass: { src: "/species-photos/white_seabass.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/white-seabass/false/" },
  yellowtail: { src: "/species-photos/yellowtail.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/yellowtail/false/" },
  barred_sand_bass: { src: "/species-photos/barred_sand_bass.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/barred-sand-bass/false/" },
  kelp_bass: { src: "/species-photos/kelp_bass.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/kelp-bass/false/" },
  spotted_sand_bass: { src: "/species-photos/spotted_sand_bass.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/spotted-sand-bass/false/" },
  california_sheephead: { src: "/species-photos/california_sheephead.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/california-sheephead/false/" },
  lingcod: { src: "/species-photos/lingcod.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/lingcod/false/" },
  cabezon: { src: "/species-photos/cabezon.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/cabezon/false/" },
  kelp_greenling: { src: "/species-photos/kelp_greenling.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/kelp-greenling/false/" },
  ocean_whitefish: { src: "/species-photos/ocean_whitefish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/ocean-whitefish/false/" },
  giant_sea_bass: { src: "/species-photos/giant_sea_bass.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/giant-sea-bass/false/" },
  leopard_shark: { src: "/species-photos/leopard_shark.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/leopard-shark/false/" },
  california_scorpionfish: { src: "/species-photos/california_scorpionfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/california-scorpionfish/false/" },
  vermilion_rockfish: { src: "/species-photos/vermilion_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/vermilion-rockfish/false/" },
  copper_rockfish: { src: "/species-photos/copper_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/copper-rockfish/false/" },
  canary_rockfish: { src: "/species-photos/canary_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/canary-rockfish/false/" },
  yelloweye_rockfish: { src: "/species-photos/yelloweye_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/yelloweye-rockfish/false/" },
  cowcod: { src: "/species-photos/cowcod.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/cowcod/false/" },
  blue_rockfish: { src: "/species-photos/blue_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/blue-rockfish/false/" },
  black_rockfish: { src: "/species-photos/black_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/black-rockfish/false/" },
  olive_rockfish: { src: "/species-photos/olive_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/olive-rockfish/false/" },
  gopher_rockfish: { src: "/species-photos/gopher_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/gopher-rockfish/false/" },
  bocaccio: { src: "/species-photos/bocaccio.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/bocaccio/false/" },
  bronzespotted_rockfish: { src: "/species-photos/bronzespotted_rockfish.jpg", credit: "guppies.za.net", license: S, sourceUrl: "https://www.guppies.za.net/species.aspx?name=bronzespotted-rockfish-sebastes-gilli&fid=10136" },
  quillback_rockfish: { src: "/species-photos/quillback_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/quillback-rockfish/false/" },
  chinook_salmon: { src: "/species-photos/chinook_salmon.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/chinook-salmon/false/" },
  coho_salmon: { src: "/species-photos/coho_salmon.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/coho-salmon/false/" },
  yellowtail_rockfish: { src: "/species-photos/yellowtail_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/yellowtail-rockfish/false/" },
  widow_rockfish: { src: "/species-photos/widow_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/widow-rockfish/false/" },
  china_rockfish: { src: "/species-photos/china_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/china-rockfish/false/" },
  grass_rockfish: { src: "/species-photos/grass_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/grass-rockfish/false/" },
  calico_rockfish: { src: "/species-photos/calico_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/calico-rockfish/false/" },
  brown_rockfish: { src: "/species-photos/brown_rockfish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/brown-rockfish/false/" },
  treefish: { src: "/species-photos/treefish.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/treefish/false/" },
  starry_flounder: { src: "/species-photos/starry_flounder.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/starry-flounder/false/" },
  pacific_halibut: { src: "/species-photos/pacific_halibut.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/pacific-halibut/false/" },
  striped_bass: { src: "/species-photos/striped_bass.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/striped-bass/false/" },
  white_sturgeon: { src: "/species-photos/white_sturgeon.jpg", credit: "CDFW CA Marine Species Portal (ID illustration, Amadeo Bachar)", license: W, sourceUrl: "https://marinespecies.wildlife.ca.gov/white-sturgeon/false/" },
};

export function speciesPhoto(speciesId: string): SpeciesPhoto | null {
  return SPECIES_PHOTOS[speciesId] ?? null;
}
