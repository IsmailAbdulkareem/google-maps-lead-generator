import { searchPlaces } from "./google-places";
import { analyzeWebsite } from "./website-analyzer";
import { scoreLead, sortLeads } from "./lead-scorer";
import type { ScoredLead, SearchParams } from "./types";

const WEBSITE_CONCURRENCY = 5;

async function analyzePlacesInParallel(
  places: Awaited<ReturnType<typeof searchPlaces>>
): Promise<ScoredLead[]> {
  const scored: ScoredLead[] = [];

  for (let i = 0; i < places.length; i += WEBSITE_CONCURRENCY) {
    const batch = places.slice(i, i + WEBSITE_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (place) => {
        const { status: websiteStatus, email } = await analyzeWebsite(
          place.website
        );
        const withEmail = { ...place, email };
        return scoreLead(withEmail, websiteStatus);
      })
    );
    scored.push(...batchResults);
  }

  return scored;
}

export async function runLeadSearch(params: SearchParams): Promise<{
  query: string;
  leads: ScoredLead[];
}> {
  const query = [
    params.category,
    params.industry,
    params.area,
    params.city,
    params.country,
  ]
    .filter(Boolean)
    .join(" ");

  const places = await searchPlaces(params);
  const scored = await analyzePlacesInParallel(places);

  return {
    query,
    leads: sortLeads(scored),
  };
}

/** Area variants for multi-search to reach higher lead counts. */
const AREA_VARIANTS = [
  "",
  "downtown",
  "north",
  "south",
  "east",
  "west",
  "central",
  "suburbs",
];

export async function runMultiLeadSearch(
  baseParams: SearchParams,
  options: {
    maxSearches: number;
    onProgress?: (info: {
      searchesRun: number;
      totalLeads: number;
      query: string;
    }) => void;
  }
): Promise<{ query: string; leads: ScoredLead[]; searchesRun: number }> {
  const seen = new Set<string>();
  const allLeads: ScoredLead[] = [];
  let searchesRun = 0;

  const areasToTry = baseParams.area
    ? [baseParams.area, ...AREA_VARIANTS.filter((a) => a !== baseParams.area)]
    : AREA_VARIANTS;

  for (const areaVariant of areasToTry) {
    if (searchesRun >= options.maxSearches) break;

    const params: SearchParams = {
      ...baseParams,
      area: areaVariant || undefined,
    };

    const result = await runLeadSearch(params);
    searchesRun++;

    for (const lead of result.leads) {
      if (!seen.has(lead.placeId)) {
        seen.add(lead.placeId);
        allLeads.push(lead);
      }
    }

    options.onProgress?.({
      searchesRun,
      totalLeads: allLeads.length,
      query: result.query,
    });
  }

  const query = [
    baseParams.category,
    baseParams.industry,
    baseParams.city,
    baseParams.country,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    query,
    leads: sortLeads(allLeads),
    searchesRun,
  };
}

export function leadToExport(lead: {
  businessName: string;
  category: string;
  address: string;
  city: string;
  rating: number | null;
  reviews: number | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  leadScore: number;
  priority: string;
}) {
  return {
    business_name: lead.businessName,
    category: lead.category,
    address: lead.address,
    city: lead.city,
    rating: lead.rating,
    reviews: lead.reviews,
    website: lead.website,
    phone: lead.phone,
    email: lead.email,
    lead_score: lead.leadScore,
    priority: lead.priority,
  };
}
