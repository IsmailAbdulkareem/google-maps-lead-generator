import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPlanLimits, isUnlimited } from "./plans";
import type { UsageData, UsageStats, PlanTier } from "./types";

/** Today's date string in YYYY-MM-DD (UTC). */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO timestamp for next midnight UTC (when counters reset). */
function nextMidnightUTC(): string {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return tomorrow.toISOString();
}

/** Default usage data for a fresh day. */
function freshUsage(): UsageData {
  return { date: todayUTC(), searches: 0, leads: 0 };
}

/**
 * Read the user's current usage from Clerk privateMetadata.
 * Returns fresh defaults if no data exists or if the day has changed.
 */
export async function getUserUsage(userId: string): Promise<UsageData> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const raw = user.privateMetadata?.usage as UsageData | undefined;
  const today = todayUTC();

  console.log("[Usage] stored date:", raw?.date, "| today UTC:", today, "| match:", raw?.date === today);

  if (!raw || raw.date !== today) {
    console.log("[Usage] Date mismatch — resetting to fresh usage");
    return freshUsage();
  }

  return raw;
}

/**
 * Get the user's plan tier using Clerk's has() method from auth().
 * This checks the actual Clerk Billing subscription status.
 */
export async function getUserTier(): Promise<PlanTier> {
  const { has } = await auth();
  if (has({ plan: "pro_plan" })) return "pro";
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
    resetAt: nextMidnightUTC(),
  };
}

/**
 * Record usage after a successful search.
 * Updates Clerk privateMetadata with incremented counters.
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
    date: todayUTC(),
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
    resetAt: nextMidnightUTC(),
  };
}

/**
 * Cap a leads array to the user's remaining daily lead quota.
 */
export function capLeadsToRemaining<T>(
  leads: T[],
  leadsRemaining: number
): T[] {
  if (leadsRemaining === -1) return leads;
  if (leads.length <= leadsRemaining) return leads;
  return leads.slice(0, leadsRemaining);
}
