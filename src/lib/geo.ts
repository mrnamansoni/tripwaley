/**
 * Where a trip actually is, for the weather card on the trip page.
 *
 * This used to be a regex table inside src/app/trips/[slug]/page.tsx, matched
 * against `name + destination + route` concatenated, first-match-wins. That
 * failed two ways:
 *
 *   • A destination the table didn't list got no weather at all — Lansdowne,
 *     Andaman, Meghalaya and Kerala were all blank.
 *   • It could match the WRONG place. "Manali Exploration" has destination
 *     "Manali", but its route mentions Kasol, and the Kasol pattern sat earlier
 *     in the array — so a Manali trip showed Kasol's weather. Concatenating the
 *     fields threw away the information that would have decided it.
 *
 * So specificity beats table order. `destination` is the field the owner fills
 * in to say where the trip goes; `route` is a rambling list of stops and is
 * consulted last. And any package can carry explicit coordinates, which win
 * outright — that is the self-service escape hatch, so this table never has to
 * be edited again for a new destination.
 *
 * Pure and importless, so scripts/test-geo.mjs can exercise it directly.
 */

export interface Geo {
  lat: number;
  lng: number;
  place: string;
}

export const GEO_TABLE: [RegExp, Geo][] = [
  [/kedarkantha/i, { lat: 31.02, lng: 78.18, place: "Kedarkantha base" }],
  [/chopta|tungnath|kedarnath/i, { lat: 30.47, lng: 79.04, place: "Chopta" }],
  [/kasol|kheerganga|parvati|tosh/i, { lat: 32.01, lng: 77.31, place: "Kasol" }],
  [/jibhi|tirthan|raghupur|shoja|sojha/i, { lat: 31.59, lng: 77.34, place: "Jibhi" }],
  [/spiti|kaza/i, { lat: 32.22, lng: 78.07, place: "Kaza, Spiti" }],
  [/jispa|keylong|baralacha/i, { lat: 32.64, lng: 77.16, place: "Jispa" }],
  [/kashmir|srinagar|gulmarg|shikara/i, { lat: 34.08, lng: 74.8, place: "Srinagar" }],
  [/goa/i, { lat: 15.3, lng: 74.08, place: "Goa" }],
  [/udaipur|rajasthan|jodhpur/i, { lat: 24.58, lng: 73.71, place: "Udaipur" }],
  [/rishikesh/i, { lat: 30.09, lng: 78.27, place: "Rishikesh" }],
  [/mcleod|triund|bir|dharamshala/i, { lat: 32.24, lng: 76.32, place: "McLeodganj" }],
  [/valley of flowers|flower/i, { lat: 30.73, lng: 79.61, place: "Valley of Flowers" }],
  [/shimla|kufri|mashobra/i, { lat: 31.1, lng: 77.17, place: "Shimla" }],
  [/manali/i, { lat: 32.24, lng: 77.19, place: "Manali" }],

  /* destinations that previously showed no weather at all */
  [/lansdowne/i, { lat: 29.84, lng: 78.68, place: "Lansdowne" }],
  [/andaman|havelock|port blair|neil island/i, { lat: 11.62, lng: 92.73, place: "Port Blair" }],
  [/meghalaya|shillong|cherrapunji|dawki|mawlynnong/i, { lat: 25.57, lng: 91.88, place: "Shillong" }],
  [/kerala|munnar|alleppey|alappuzha|backwater/i, { lat: 10.09, lng: 77.06, place: "Munnar" }],
];

export interface GeoSource {
  name?: string;
  destination?: string;
  route?: string;
  /** admin-set coordinates — these win outright */
  lat?: number;
  lng?: number;
  weatherPlace?: string;
}

function lookup(haystack: string | undefined): Geo | null {
  const s = (haystack ?? "").trim();
  if (!s) return null;
  for (const [re, geo] of GEO_TABLE) if (re.test(s)) return geo;
  return null;
}

/**
 * Resolve a trip to a point, most specific signal first.
 *
 * Returns null rather than guessing: no weather card is better than the wrong
 * city's weather, which is what the old lookup produced.
 */
export function resolveGeo(pkg: GeoSource): Geo | null {
  // 1. explicit coordinates from the admin panel
  const { lat, lng } = pkg;
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    // a lone latitude is a half-finished edit, and 0,0 is the Atlantic —
    // both are data-entry slips, so fall through to the table instead
    !(lat === 0 && lng === 0)
  ) {
    return {
      lat: lat as number,
      lng: lng as number,
      place: (pkg.weatherPlace || pkg.destination || "").trim() || "the destination",
    };
  }

  // 2. destination, 3. name, 4. route — never all three concatenated
  const hit = lookup(pkg.destination) ?? lookup(pkg.name) ?? lookup(pkg.route);
  if (!hit) return null;

  // an explicit label still applies even when the point came from the table
  return pkg.weatherPlace?.trim() ? { ...hit, place: pkg.weatherPlace.trim() } : hit;
}
