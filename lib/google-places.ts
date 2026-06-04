import { getEnvInt } from "./utils";
import type { BusinessPlace, SearchParams } from "./types";

/** Places API (New) — requires "Places API" (places.googleapis.com) enabled */
const PLACES_NEW_BASE = "https://places.googleapis.com/v1";

/** Classic Places API — uses maps.googleapis.com (legacy Web Service) */
const PLACES_LEGACY_BASE = "https://maps.googleapis.com/maps/api/place";

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.primaryType",
  "places.types",
].join(",");

type ApiMode = "new" | "legacy" | "auto";

interface PlacesDisplayName {
  text?: string;
}

interface PlacesAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface PlacesPlace {
  id?: string;
  displayName?: PlacesDisplayName;
  formattedAddress?: string;
  addressComponents?: PlacesAddressComponent[];
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  primaryType?: string;
  types?: string[];
}

interface SearchTextResponse {
  places?: PlacesPlace[];
}

interface LegacyTextSearchResult {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
}

interface LegacyTextSearchResponse {
  status: string;
  results?: LegacyTextSearchResult[];
  error_message?: string;
  next_page_token?: string;
}

interface LegacyAddressComponent {
  long_name?: string;
  short_name?: string;
  types?: string[];
}

interface LegacyDetailsResult {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  address_components?: LegacyAddressComponent[];
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  url?: string;
  types?: string[];
}

interface LegacyDetailsResponse {
  status: string;
  result?: LegacyDetailsResult;
  error_message?: string;
}

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key?.trim()) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }
  return key.trim();
}

function getApiMode(): ApiMode {
  const mode = process.env.GOOGLE_PLACES_API_MODE?.toLowerCase();
  if (mode === "new" || mode === "legacy" || mode === "auto") return mode;
  return "auto";
}

export function buildTextQuery(params: SearchParams): string {
  const parts: string[] = [params.category];
  if (params.industry?.trim()) parts.push(params.industry.trim());
  if (params.area?.trim()) parts.push(`in ${params.area.trim()}`);
  parts.push(`in ${params.city.trim()}`);
  if (params.country?.trim()) parts.push(params.country.trim());
  return parts.join(" ");
}

function countryToRegionCode(country?: string): string | undefined {
  if (!country?.trim()) return undefined;
  const c = country.trim().toLowerCase();
  const map: Record<string, string> = {
    pakistan: "pk",
    pk: "pk",
    "united states": "us",
    usa: "us",
    us: "us",
    "united kingdom": "gb",
    uk: "gb",
    india: "in",
    uae: "ae",
    "united arab emirates": "ae",
    canada: "ca",
    australia: "au",
  };
  if (map[c]) return map[c];
  if (c.length === 2) return c;
  return undefined;
}

function extractCityFromNewComponents(
  components: PlacesAddressComponent[] | undefined,
  fallbackCity: string
): string {
  if (!components?.length) return fallbackCity;
  const locality = components.find((c) => c.types?.includes("locality"));
  if (locality?.longText) return locality.longText;
  const admin = components.find((c) =>
    c.types?.includes("administrative_area_level_1")
  );
  if (admin?.longText) return admin.longText;
  return fallbackCity;
}

function extractCityFromLegacyComponents(
  components: LegacyAddressComponent[] | undefined,
  fallbackCity: string
): string {
  if (!components?.length) return fallbackCity;
  const locality = components.find((c) => c.types?.includes("locality"));
  if (locality?.long_name) return locality.long_name;
  const admin = components.find((c) =>
    c.types?.includes("administrative_area_level_1")
  );
  if (admin?.long_name) return admin.long_name;
  return fallbackCity;
}

function mapNewPlace(place: PlacesPlace, fallbackCity: string): BusinessPlace | null {
  const rawId = place.id ?? "";
  const placeId = rawId.replace(/^places\//, "");
  if (!placeId) return null;

  const businessName = place.displayName?.text?.trim() || "Not Available";
  const category =
    place.primaryType?.replace(/_/g, " ") ||
    place.types?.[0]?.replace(/_/g, " ") ||
    "Not Available";

  return {
    placeId,
    businessName,
    category,
    address: place.formattedAddress?.trim() || "Not Available",
    city: extractCityFromNewComponents(place.addressComponents, fallbackCity),
    phone: place.nationalPhoneNumber?.trim() || null,
    email: null,
    website: place.websiteUri?.trim() || null,
    rating: place.rating ?? null,
    reviews: place.userRatingCount ?? null,
    googleMapsLink: place.googleMapsUri?.trim() || null,
    businessStatus: place.businessStatus ?? null,
  };
}

function mapLegacyDetails(
  details: LegacyDetailsResult,
  fallbackCity: string
): BusinessPlace | null {
  if (!details.place_id) return null;

  const businessName = details.name?.trim() || "Not Available";
  const category =
    details.types?.[0]?.replace(/_/g, " ") || "Not Available";

  return {
    placeId: details.place_id,
    businessName,
    category,
    address: details.formatted_address?.trim() || "Not Available",
    city: extractCityFromLegacyComponents(
      details.address_components,
      fallbackCity
    ),
    phone:
      details.international_phone_number?.trim() ||
      details.formatted_phone_number?.trim() ||
      null,
    email: null,
    website: details.website?.trim() || null,
    rating: details.rating ?? null,
    reviews: details.user_ratings_total ?? null,
    googleMapsLink: details.url?.trim() || null,
    businessStatus: details.business_status?.toUpperCase() ?? null,
  };
}

function isNewApiNotEnabledError(status: number, body: string): boolean {
  return (
    status === 403 &&
    (body.includes("places.googleapis.com") ||
      body.includes("Places API (New)") ||
      body.includes("SERVICE_DISABLED"))
  );
}

async function searchPlacesNew(params: SearchParams): Promise<BusinessPlace[]> {
  const textQuery = buildTextQuery(params);
  const pageSize = Math.min(getEnvInt("MAX_RESULTS_PER_SEARCH", 20), 20);
  const regionCode = countryToRegionCode(params.country);

  const body: Record<string, unknown> = {
    textQuery,
    pageSize,
  };
  if (regionCode) body.regionCode = regionCode;

  const response = await fetch(`${PLACES_NEW_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  const errText = await response.text();

  if (!response.ok) {
    const err = new Error(
      `Google Places API (New) error (${response.status}): ${errText.slice(0, 400)}`
    );
    (err as Error & { status: number; isNewApiDisabled: boolean }).status =
      response.status;
    (err as Error & { isNewApiDisabled: boolean }).isNewApiDisabled =
      isNewApiNotEnabledError(response.status, errText);
    throw err;
  }

  const data = JSON.parse(errText) as SearchTextResponse;
  return dedupePlaces(
    (data.places ?? [])
      .map((p) => mapNewPlace(p, params.city))
      .filter((p): p is BusinessPlace => p !== null)
  );
}

async function fetchLegacyPlaceDetails(
  placeId: string,
  fallbackCity: string
): Promise<BusinessPlace | null> {
  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "address_components",
    "formatted_phone_number",
    "international_phone_number",
    "website",
    "rating",
    "user_ratings_total",
    "business_status",
    "url",
    "types",
  ].join(",");

  const url = new URL(`${PLACES_LEGACY_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", fields);
  url.searchParams.set("key", getApiKey());

  const response = await fetch(url.toString());
  const data = (await response.json()) as LegacyDetailsResponse;

  if (data.status !== "OK" || !data.result) {
    return null;
  }

  return mapLegacyDetails(data.result, fallbackCity);
}

async function searchPlacesLegacy(params: SearchParams): Promise<BusinessPlace[]> {
  const textQuery = buildTextQuery(params);
  const url = new URL(`${PLACES_LEGACY_BASE}/textsearch/json`);
  url.searchParams.set("query", textQuery);
  url.searchParams.set("key", getApiKey());

  const response = await fetch(url.toString());
  const data = (await response.json()) as LegacyTextSearchResponse;

  if (data.status !== "OK") {
    const msg = data.error_message ?? data.status;
    throw new Error(
      `Google Places API (Legacy) error: ${msg}. Enable "Places API" at https://console.cloud.google.com/google/maps-apis/api-list`
    );
  }

  const maxResults = Math.min(getEnvInt("MAX_RESULTS_PER_SEARCH", 20), 20);
  const results = (data.results ?? []).slice(0, maxResults);
  const places: BusinessPlace[] = [];

  for (const result of results) {
    if (!result.place_id) continue;
    const detailed = await fetchLegacyPlaceDetails(
      result.place_id,
      params.city
    );
    if (detailed) {
      places.push(detailed);
      continue;
    }
    places.push({
      placeId: result.place_id,
      businessName: result.name?.trim() || "Not Available",
      category: result.types?.[0]?.replace(/_/g, " ") || "Not Available",
      address: result.formatted_address?.trim() || "Not Available",
      city: params.city,
      phone: null,
      email: null,
      website: null,
      rating: result.rating ?? null,
      reviews: result.user_ratings_total ?? null,
      googleMapsLink: `https://www.google.com/maps/place/?q=place_id:${result.place_id}`,
      businessStatus: result.business_status?.toUpperCase() ?? null,
    });
  }

  return dedupePlaces(places);
}

function dedupePlaces(places: BusinessPlace[]): BusinessPlace[] {
  const seen = new Set<string>();
  return places.filter((p) => {
    if (seen.has(p.placeId)) return false;
    seen.add(p.placeId);
    return true;
  });
}

export async function searchPlaces(
  params: SearchParams
): Promise<BusinessPlace[]> {
  const mode = getApiMode();

  if (mode === "legacy") {
    return searchPlacesLegacy(params);
  }

  if (mode === "new") {
    return searchPlacesNew(params);
  }

  // auto: try New API first, fall back to Legacy on 403
  try {
    return await searchPlacesNew(params);
  } catch (error) {
    const err = error as Error & { isNewApiDisabled?: boolean };
    if (err.isNewApiDisabled) {
      console.warn(
        "Places API (New) unavailable — falling back to Legacy Places API (maps.googleapis.com)"
      );
      return searchPlacesLegacy(params);
    }
    throw error;
  }
}

export function serializePlace(place: BusinessPlace): string {
  return JSON.stringify(place);
}

export function deserializePlace(data: string): BusinessPlace {
  return JSON.parse(data) as BusinessPlace;
}
