import type { PlanTier } from "./types";
import { getEnvInt } from "./utils";

export interface PlanDefinition {
  name: string;
  tier: PlanTier;
  price: number;
  yearlyPrice: number;
  searchesPerDay: number;
  leadsPerDay: number;
  aiMessagesPerDay: number;
  exportFormats: string[];
  features: string[];
  aiFeatures: string[];
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    name: "Free",
    tier: "free",
    price: 0,
    yearlyPrice: 0,
    searchesPerDay: 5,
    leadsPerDay: 25,
    aiMessagesPerDay: 20,
    exportFormats: ["csv"],
    features: [
      "5 searches per day",
      "25 leads per day",
      "Basic lead scoring",
      "CSV export",
      "Saved on device",
    ],
    aiFeatures: ["AI chat search", "Lead filtering", "Score explanations", "Personalized outreach drafts"],
  },
  pro: {
    name: "Pro",
    tier: "pro",
    price: 20,
    yearlyPrice: 200,
    searchesPerDay: 50,
    leadsPerDay: 500,
    aiMessagesPerDay: 200,
    exportFormats: ["csv", "pdf", "word", "json"],
    features: [
      "50 searches per day",
      "500 leads per day",
      "Advanced lead scoring",
      "CSV, PDF, Word, JSON export",
      "Priority support",
    ],
    aiFeatures: [
      "AI chat search",
      "Lead filtering",
      "Score explanations",
      "Personalized outreach drafts",
      "Bulk search jobs",
    ],
  },

};

export function getUserPlan(user: { publicMetadata?: Record<string, unknown> }): PlanTier {
  const subscription = user.publicMetadata?.subscription as { tier?: PlanTier } | undefined;
  return subscription?.tier ?? "free";
}

export function getPlanLimits(tier: PlanTier): {
  maxSearches: number;
  maxLeads: number;
  maxAiMessages: number;
  exportFormats: string[];
  aiFeatures: string[];
} {
  const plan = PLANS[tier];
  const base = {
    maxSearches: plan.searchesPerDay,
    maxLeads: plan.leadsPerDay,
    maxAiMessages: plan.aiMessagesPerDay,
    exportFormats: plan.exportFormats,
    aiFeatures: plan.aiFeatures,
  };

  // Env overrides apply to the free tier (dev / self-hosted tuning).
  if (tier === "free") {
    return {
      ...base,
      maxSearches: getEnvInt("MAX_SEARCHES_PER_DAY", base.maxSearches),
      maxLeads: getEnvInt("MAX_LEADS_PER_DAY", base.maxLeads),
      maxAiMessages: getEnvInt(
        "MAX_AI_MESSAGES_PER_DAY",
        base.maxAiMessages
      ),
    };
  }

  return base;
}

export function hasProAiFeature(tier: PlanTier, feature: string): boolean {
  return PLANS[tier].aiFeatures.includes(feature);
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}
