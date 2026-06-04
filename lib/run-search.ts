import { searchPlaces } from "./google-places";
import { analyzeWebsite } from "./website-analyzer";
import { scoreLead, sortLeads } from "./lead-scorer";
import type { ScoredLead, SearchParams } from "./types";

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
  const scored: ScoredLead[] = [];

  for (const place of places) {
    const { status: websiteStatus, email } = await analyzeWebsite(
      place.website
    );
    const withEmail = { ...place, email };
    scored.push(scoreLead(withEmail, websiteStatus));
  }

  return {
    query,
    leads: sortLeads(scored),
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
