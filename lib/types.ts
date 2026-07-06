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
  searches: number;
  leads: number;
  aiMessages?: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OutreachRequest {
  lead: ScoredLead;
  userService: string;
  channel: "email" | "sms" | "linkedin" | "whatsapp";
  tone?: "professional" | "friendly" | "direct";
  language?: string;
  includeSubject?: boolean;
}

export interface OutreachResult {
  subject?: string;
  body: string;
  personalizationHooks: string[];
}

export interface ScoreExplanation {
  score: number;
  breakdown: { criterion: string; points: number }[];
  rationale: string;
  pitchAngle: string;
}

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface BulkSearchJob {
  id: string;
  userId: string;
  status: JobStatus;
  params: SearchParams;
  targetCount: number;
  minScore: number;
  maxScore: number;
  leads: ScoredLead[];
  searchesRun: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServerSavedSearch {
  id: string;
  userId: string;
  query: string;
  params: SearchParams;
  leads: ScoredLead[];
  createdAt: string;
}

export interface UsageStats {
  searchesUsed: number;
  searchesRemaining: number;
  leadsUsed: number;
  leadsRemaining: number;
  maxSearches: number;
  maxLeads: number;
}
