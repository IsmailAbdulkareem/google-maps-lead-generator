export type PlanTier = "free" | "pro";

export interface SubscriptionData {
  tier: PlanTier;
  currentPeriodEnd?: string;
}

export interface PlanLimits {
  tier: PlanTier;
  maxSearches: number;
  maxLeads: number;
  exportFormats: string[];
}

export type LeadPriority = "high" | "medium" | "low";

export type WebsiteStatus =
  | "none"
  | "unreachable"
  | "likely_outdated"
  | "ok"
  | "not_checked";

export interface BusinessPlace {
  placeId: string;
  businessName: string;
  category: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  googleMapsLink: string | null;
  businessStatus: string | null;
}

export interface ScoredLead extends BusinessPlace {
  leadScore: number;
  priority: LeadPriority;
  websiteStatus: WebsiteStatus;
  weakDigitalPresence: boolean;
}

export interface SearchParams {
  category: string;
  city: string;
  area?: string;
  country?: string;
  industry?: string;
}

export interface ExportLead {
  business_name: string;
  category: string;
  address: string;
  rating: number | null;
  reviews: number | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  lead_score: number;
}

export interface UsageData {
  date: string; // YYYY-MM-DD in UTC
  searches: number;
  leads: number;
}

export interface UsageStats {
  searchesUsed: number;
  searchesRemaining: number;
  leadsUsed: number;
  leadsRemaining: number;
  maxSearches: number;
  maxLeads: number;
  resetAt: string; // ISO timestamp when counters reset (next midnight UTC)
}
