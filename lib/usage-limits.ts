import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPlanLimits, isUnlimited } from "./plans";
import type { UsageData, UsageStats, PlanTier } from "./types";

/** Default usage data for a new user. */
function freshUsage(): UsageData {
  return { searches: 0, leads: 0 };
}

/**
 * Read the user's current usage from Clerk privateMetadata.
 * Usage is cumulative and never resets — free trial is one-time only.
 */
export async function getUserUsage(userId: string): Promise<UsageData> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const raw = user.privateMetadata?.usage as UsageData | undefined;

  if (!raw) {
    return freshUsage();
  }

  return { searches: raw.searches ?? 0, leads: raw.leads ?? 0 };
}

/**
 * Get the user's plan tier.
 * Pro subscriptions are not yet available — always returns "free"
 * so no one can bypass limits via Clerk billing.
 */
export async function getUserTier(): Promise<PlanTier> {
  return "free";
}

/**
 * Check whether the user is allowed to perform a search.
 * Returns full stats including remaining counts and plan info.
 */
export async function checkLimits(): Promise<UsageStats & { tier: PlanTier; exportFormats: string[] }> {
  const { userId } = await auth();
  const tier = await getUserTier();
  const { maxSearches, maxLeads, exportFormats } = getPlanLimits(tier);
  const usage = userId ? await getUserUsage(userId) : freshUsage();

  const searchesUsed = usage.searches;
  const leadsUsed = usage.leads;

  const searchesRemaining = isUnlimited(maxSearches)
    ? -1
    : Math.max(0, maxSearches - searchesUsed);
  const leadsRemaining = isUnlimited(maxLeads)
    ? -1
    : Math.max(0, maxLeads - leadsUsed);

  return {
    tier,
    exportFormats,
    searchesUsed,
    searchesRemaining,
    leadsUsed,
    leadsRemaining,
    maxSearches,
    maxLeads,
  };
}

/**
 * Record usage after a successful search.
 * Updates Clerk privateMetadata with incremented counters.
 * Usage is cumulative — never resets.
 */
export async function recordUsage(
  userId: string,
  searchIncrement: number,
  leadIncrement: number
): Promise<UsageStats & { tier: PlanTier; exportFormats: string[] }> {
  const usage = await getUserUsage(userId);
  const tier = await getUserTier();
  const { maxSearches, maxLeads, exportFormats } = getPlanLimits(tier);

  const updated: UsageData = {
    searches: usage.searches + searchIncrement,
    leads: usage.leads + leadIncrement,
  };

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    privateMetadata: { usage: updated },
  });

  const searchesRemaining = isUnlimited(maxSearches)
    ? -1
    : Math.max(0, maxSearches - updated.searches);
  const leadsRemaining = isUnlimited(maxLeads)
    ? -1
    : Math.max(0, maxLeads - updated.leads);

  return {
    tier,
    exportFormats,
    searchesUsed: updated.searches,
    searchesRemaining,
    leadsUsed: updated.leads,
    leadsRemaining,
    maxSearches,
    maxLeads,
  };
}

/**
 * Cap a leads array to the user's remaining lead quota.
 */
export function capLeadsToRemaining<T>(
  leads: T[],
  leadsRemaining: number
): T[] {
  if (leadsRemaining === -1) return leads;
  if (leads.length <= leadsRemaining) return leads;
  return leads.slice(0, leadsRemaining);
}
