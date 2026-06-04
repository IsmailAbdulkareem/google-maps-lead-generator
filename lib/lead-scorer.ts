import type { BusinessPlace, LeadPriority, ScoredLead, WebsiteStatus } from "./types";

export function calculateLeadScore(input: {
  hasWebsite: boolean;
  rating: number | null;
  reviews: number | null;
  phone: string | null;
  businessStatus: string | null;
}): number {
  let score = 0;
  if (!input.hasWebsite) score += 50;
  if (input.rating !== null && input.rating > 4.0) score += 20;
  if (input.reviews !== null && input.reviews > 100) score += 15;
  if (input.phone) score += 10;
  if (input.businessStatus === "OPERATIONAL") score += 5;
  return score;
}

export function getPriority(score: number): LeadPriority {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function hasWeakDigitalPresence(
  rating: number | null,
  reviews: number | null,
  websiteStatus: WebsiteStatus
): boolean {
  const strongReviews =
    rating !== null && rating >= 4.0 && reviews !== null && reviews > 100;
  const weakSite = websiteStatus === "none" || websiteStatus === "likely_outdated";
  return strongReviews && weakSite;
}

export function scoreLead(
  place: BusinessPlace,
  websiteStatus: WebsiteStatus
): ScoredLead {
  const hasWebsite = Boolean(place.website?.trim());
  const leadScore = calculateLeadScore({
    hasWebsite,
    rating: place.rating,
    reviews: place.reviews,
    phone: place.phone,
    businessStatus: place.businessStatus,
  });
  const priority = getPriority(leadScore);
  const weakDigitalPresence = hasWeakDigitalPresence(
    place.rating,
    place.reviews,
    websiteStatus
  );

  return {
    ...place,
    leadScore,
    priority,
    websiteStatus,
    weakDigitalPresence,
  };
}

export function sortLeads(leads: ScoredLead[]): ScoredLead[] {
  const priorityOrder: Record<LeadPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  return [...leads].sort((a, b) => {
    const p = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (p !== 0) return p;
    return b.leadScore - a.leadScore;
  });
}
