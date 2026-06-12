import type { PlanTier } from "./types";

export interface PlanDefinition {
  name: string;
  tier: PlanTier;
  price: number;
  yearlyPrice: number;
  searchesPerDay: number;
  leadsPerDay: number;
  exportFormats: string[];
  features: string[];
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    name: "Free",
    tier: "free",
    price: 0,
    yearlyPrice: 0,
    searchesPerDay: 5,
    leadsPerDay: 25,
    exportFormats: ["csv"],
    features: [
      "5 searches per day",
      "25 leads per day",
      "Basic lead scoring",
      "CSV export",
      "Saved on device",
    ],
  },
  pro: {
    name: "Pro",
    tier: "pro",
    price: 20,
    yearlyPrice: 200,
    searchesPerDay: 50,
    leadsPerDay: 500,
    exportFormats: ["csv", "pdf", "word", "json"],
    features: [
      "50 searches per day",
      "500 leads per day",
      "Advanced lead scoring",
      "CSV, PDF, Word, JSON export",
      "Priority support",
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
  exportFormats: string[];
} {
  const plan = PLANS[tier];
  return {
    maxSearches: plan.searchesPerDay,
    maxLeads: plan.leadsPerDay,
    exportFormats: plan.exportFormats,
  };
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}
