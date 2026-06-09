import { clerkClient } from "@clerk/nextjs/server";
// clerkClient is an async function in Clerk v7+ — call it to get the ClerkClient instance
import { getEnvInt } from "./utils";
import type { UsageData, UsageStats } from "./types";

/** Read daily limits from env (with sensible defaults). */
export function getEnvLimits() {
  return {
    maxSearches: getEnvInt("MAX_SEARCHES_PER_DAY", 5),
    maxLeads: getEnvInt("MAX_LEADS_PER_DAY", 20),
  };
}

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

  if (!raw || raw.date !== todayUTC()) {
    return freshUsage();
  }

  return raw;
}

/**
 * Check whether the user is allowed to perform a search.
 * Returns full stats including remaining counts.
 */
export async function checkLimits(userId: string): Promise<UsageStats> {
  const { maxSearches, maxLeads } = getEnvLimits();
  const usage = await getUserUsage(userId);

  // Auto-reset if day changed (getUserUsage already handles this)
  const searchesUsed = usage.searches;
  const leadsUsed = usage.leads;

  return {
    searchesUsed,
    searchesRemaining: Math.max(0, maxSearches - searchesUsed),
    leadsUsed,
    leadsRemaining: Math.max(0, maxLeads - leadsUsed),
    maxSearches,
    maxLeads,
    resetAt: nextMidnightUTC(),
  };
}

/**
 * Record usage after a successful search.
 * Updates Clerk privateMetadata with incremented counters.
 * Returns the updated UsageStats.
 */
export async function recordUsage(
  userId: string,
  searchIncrement: number,
  leadIncrement: number
): Promise<UsageStats> {
  const usage = await getUserUsage(userId);
  const { maxSearches, maxLeads } = getEnvLimits();

  const updated: UsageData = {
    date: todayUTC(),
    searches: usage.searches + searchIncrement,
    leads: usage.leads + leadIncrement,
  };

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    privateMetadata: { usage: updated },
  });

  return {
    searchesUsed: updated.searches,
    searchesRemaining: Math.max(0, maxSearches - updated.searches),
    leadsUsed: updated.leads,
    leadsRemaining: Math.max(0, maxLeads - updated.leads),
    maxSearches,
    maxLeads,
    resetAt: nextMidnightUTC(),
  };
}

/**
 * Cap a leads array to the user's remaining daily lead quota.
 * If the user has 5 leads remaining and the search returns 20,
 * only the top 5 (highest-scored) leads are returned.
 */
export function capLeadsToRemaining<T>(
  leads: T[],
  leadsRemaining: number
): T[] {
  if (leads.length <= leadsRemaining) return leads;
  return leads.slice(0, leadsRemaining);
}