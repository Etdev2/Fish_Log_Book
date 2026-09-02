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
  california_halibut: { src: "/species-photos/california_halibut.jpg", credit: "Newport Bay Conservancy", license: S, sourceUrl: "https://newportbay.org/wildlife/marine-life/california-halibut/" },
  white_seabass: { src: "/species-photos/white_seabass.jpg", credit: "Big Fishes of the World", license: S, sourceUrl: "http://bigfishesoftheworld.blogspot.com/2012/09/seabass-white-atractoscion-nobilis.html" },
  yellowtail: { src: "/species-photos/yellowtail.jpg", credit: "Nature Picture Library", license: S, sourceUrl: "https://www.naturepl.com/stock-photo-california-yellowtail-seriola-lalandi-dorsalis-nature-image01582784.html" },
  barred_sand_bass: { src: "/species-photos/barred_sand_bass.jpg", credit: "FishBase", license: S, sourceUrl: "https://www.fishbase.se/summary/3337" },
  kelp_bass: { src: "/species-photos/kelp_bass.jpg", credit: "Oceanlight / Philippe Widmann", license: S, sourceUrl: "https://www.oceanlight.com/lightbox.php?sp=paralabrax_clathratus" },
  spotted_sand_bass: { src: "/species-photos/spotted_sand_bass.jpg", credit: "FishBase", license: S, sourceUrl: "https://www.fishbase.se/Summary/SpeciesSummary.php?id=3336&lang=spanish" },
  california_sheephead: { src: "/species-photos/california_sheephead.jpg", credit: "Wikimedia Commons (California sheephead, big male)", license: P, sourceUrl: "https://en.wikipedia.org/wiki/California_sheephead" },
  lingcod: { src: "/species-photos/lingcod.jpg", credit: "Dreamstime stock", license: S, sourceUrl: "https://www.dreamstime.com/photos-images/ling-cod.html" },
  cabezon: { src: "/species-photos/cabezon.jpg", credit: "Bottomfish Identification Guide (via Alchetron)", license: S, sourceUrl: "https://alchetron.com/Cabezon-(fish)" },
  kelp_greenling: { src: "/species-photos/kelp_greenling.jpg", credit: "Eiko Jones Photography", license: S, sourceUrl: "https://www.eikojonesphotography.com/-/galleries/stock-images/underwater-stock-images/cold-water-fish/kelp-greenling" },
  ocean_whitefish: { src: "/species-photos/ocean_whitefish.jpg", credit: "Reeflex — Torrance Reef 2024", license: S, sourceUrl: "https://www.reeflex.net/tiere/14830_Caulolatilus_princeps.htm" },
  giant_sea_bass: { src: "/species-photos/giant_sea_bass.jpg", credit: "Giant sea bass (Wiki)", license: P, sourceUrl: "https://picturefishai.com/wiki/Stereolepis_gigas.html" },
  leopard_shark: { src: "/species-photos/leopard_shark.jpg", credit: "Wikimedia Commons", license: P, sourceUrl: "https://en.wikipedia.org/wiki/Leopard_shark" },
  california_scorpionfish: { src: "/species-photos/california_scorpionfish.jpg", credit: "Scorpionfish (Wiki)", license: P, sourceUrl: "https://picturefishai.com/wiki/Scorpaena_guttata.html" },
  vermilion_rockfish: { src: "/species-photos/vermilion_rockfish.jpg", credit: "Reeflex — Carmel 2025", license: S, sourceUrl: "https://reeflex.net/tiere/11703_Sebastes_miniatus.htm" },
  copper_rockfish: { src: "/species-photos/copper_rockfish.jpg", credit: "Oceanlight stock", license: S, sourceUrl: "http://www.oceanlight.com/spotlight.php?img=09020" },
  canary_rockfish: { src: "/species-photos/canary_rockfish.jpg", credit: "OceanInfo", license: S, sourceUrl: "https://oceaninfo.com/animals/canary-rockfish/" },
  yelloweye_rockfish: { src: "/species-photos/yelloweye_rockfish.jpg", credit: "Crappy Wildlife Photography (Flickr)", license: S, sourceUrl: "https://www.flickr.com/photos/crappywildlifephotography/20806024066" },
  cowcod: { src: "/species-photos/cowcod.jpg", credit: "Wikimedia Commons (Sebastes levis)", license: P, sourceUrl: "https://en.wikipedia.org/wiki/Sebastes_levis" },
  blue_rockfish: { src: "/species-photos/blue_rockfish.jpg", credit: "r/Fish (OC, uploader-attributed)", license: S, sourceUrl: "https://www.reddit.com/r/Fish/comments/krg760/blue_rockfish_aka_blue_seapirch_sebastes_mystinus/" },
  black_rockfish: { src: "/species-photos/black_rockfish.jpg", credit: "Oceanlight", license: S, sourceUrl: "https://oceanlight.com/lightbox.php?sp=sebastes_melanops" },
  olive_rockfish: { src: "/species-photos/olive_rockfish.jpg", credit: "Nature Footage stock still", license: S, sourceUrl: "https://www.naturefootage.com/stock-video-species/olive-rockfish/sebastes-serranoides" },
  gopher_rockfish: { src: "/species-photos/gopher_rockfish.jpg", credit: "scuba.spanglers.com", license: S, sourceUrl: "https://scuba.spanglers.com/species/sebastes-carnatus" },
  bocaccio: { src: "/species-photos/bocaccio.jpg", credit: "Joel Sartore (National Geographic Photo Ark)", license: S, sourceUrl: "https://www.joelsartore.com/fis041-00078/" },
  bronzespotted_rockfish: { src: "/species-photos/bronzespotted_rockfish.jpg", credit: "guppies.za.net", license: S, sourceUrl: "https://www.guppies.za.net/species.aspx?name=bronzespotted-rockfish-sebastes-gilli&fid=10136" },
  quillback_rockfish: { src: "/species-photos/quillback_rockfish.jpg", credit: "Oceanlight", license: S, sourceUrl: "http://www.oceanlight.com/lightbox.php?sp=sebastes_maliger" },
  chinook_salmon: { src: "/species-photos/chinook_salmon.jpg", credit: "NIWA (NZ freshwater fish atlas)", license: S, sourceUrl: "https://niwa.co.nz/freshwater/nz-freshwater-fish-database/niwa-atlas-nz-freshwater-fishes/chinook-salmon" },
  coho_salmon: { src: "/species-photos/coho_salmon.jpg", credit: "PICRYL (public domain collection)", license: P, sourceUrl: "https://picryl.com/media/salmon-coho-fish-oncorhynchus-kisutch-d60384" },
};

export function speciesPhoto(speciesId: string): SpeciesPhoto | null {
  return SPECIES_PHOTOS[speciesId] ?? null;
}
