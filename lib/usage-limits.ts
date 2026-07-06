import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPlanLimits, getUserPlan, isUnlimited } from "./plans";
import type { UsageData, UsageStats, PlanTier } from "./types";

/** Default usage data for a new user. */
function freshUsage(): UsageData {
  return { searches: 0, leads: 0, aiMessages: 0 };
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

  return {
    searches: raw.searches ?? 0,
    leads: raw.leads ?? 0,
    aiMessages: raw.aiMessages ?? 0,
  };
}

/**
 * Get the user's plan tier from Clerk publicMetadata.
 * Returns "pro" for admin email regardless of Clerk metadata.
 */
export async function getUserTier(): Promise<PlanTier> {
  const email = await getCurrentUserEmail();
  if (isAdminEmail(email)) return "pro";
  const { userId } = await auth();
  if (!userId) return "free";
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return getUserPlan(user);
}

export interface FullUsageStats extends UsageStats {
  tier: PlanTier;
  exportFormats: string[];
  aiFeatures: string[];
  aiMessagesUsed: number;
  aiMessagesRemaining: number;
  maxAiMessages: number;
}

async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    return null;
  }
}

function isAdminEmail(email: string | null): boolean {
  if (!email || !process.env.ADMIN_EMAIL) return false;
  return email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
}

/**
 * Check whether the user is allowed to perform a search.
 * Returns full stats including remaining counts and plan info.
 * If the user's email matches ADMIN_EMAIL, they get unlimited access.
 */
export async function checkLimits(): Promise<FullUsageStats> {
  const email = await getCurrentUserEmail();
  const admin = isAdminEmail(email);

  if (admin) {
    return {
      tier: "pro",
      exportFormats: ["csv", "pdf", "word", "json"],
      aiFeatures: [
        "AI chat search", "Lead filtering", "Score explanations",
        "Personalized outreach drafts", "Bulk search jobs",
      ],
      searchesUsed: 0,
      searchesRemaining: -1,
      leadsUsed: 0,
      leadsRemaining: -1,
      maxSearches: -1,
      maxLeads: -1,
      aiMessagesUsed: 0,
      aiMessagesRemaining: -1,
      maxAiMessages: -1,
    };
  }

  const { userId } = await auth();
  const tier = await getUserTier();
  const { maxSearches, maxLeads, maxAiMessages, exportFormats, aiFeatures } =
    getPlanLimits(tier);
  const usage = userId ? await getUserUsage(userId) : freshUsage();

  const searchesUsed = usage.searches;
  const leadsUsed = usage.leads;
  const aiMessagesUsed = usage.aiMessages ?? 0;

  const searchesRemaining = isUnlimited(maxSearches)
    ? -1
    : Math.max(0, maxSearches - searchesUsed);
  const leadsRemaining = isUnlimited(maxLeads)
    ? -1
    : Math.max(0, maxLeads - leadsUsed);
  const aiMessagesRemaining = isUnlimited(maxAiMessages)
    ? -1
    : Math.max(0, maxAiMessages - aiMessagesUsed);

  return {
    tier,
    exportFormats,
    aiFeatures,
    searchesUsed,
    searchesRemaining,
    leadsUsed,
    leadsRemaining,
    maxSearches,
    maxLeads,
    aiMessagesUsed,
    aiMessagesRemaining,
    maxAiMessages,
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
): Promise<FullUsageStats> {
  const usage = await getUserUsage(userId);
  const tier = await getUserTier();
  const { maxSearches, maxLeads, maxAiMessages, exportFormats, aiFeatures } =
    getPlanLimits(tier);

  const updated: UsageData = {
    searches: usage.searches + searchIncrement,
    leads: usage.leads + leadIncrement,
    aiMessages: usage.aiMessages ?? 0,
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
  const aiMessagesRemaining = isUnlimited(maxAiMessages)
    ? -1
    : Math.max(0, maxAiMessages - (updated.aiMessages ?? 0));

  return {
    tier,
    exportFormats,
    aiFeatures,
    searchesUsed: updated.searches,
    searchesRemaining,
    leadsUsed: updated.leads,
    leadsRemaining,
    maxSearches,
    maxLeads,
    aiMessagesUsed: updated.aiMessages ?? 0,
    aiMessagesRemaining,
    maxAiMessages,
  };
}

/**
 * Record AI message usage after a chat turn.
 */
export async function recordAiMessage(userId: string): Promise<FullUsageStats> {
  const usage = await getUserUsage(userId);
  const tier = await getUserTier();
  const { maxSearches, maxLeads, maxAiMessages, exportFormats, aiFeatures } =
    getPlanLimits(tier);

  const updated: UsageData = {
    searches: usage.searches,
    leads: usage.leads,
    aiMessages: (usage.aiMessages ?? 0) + 1,
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
  const aiMessagesRemaining = isUnlimited(maxAiMessages)
    ? -1
    : Math.max(0, maxAiMessages - (updated.aiMessages ?? 0));

  return {
    tier,
    exportFormats,
    aiFeatures,
    searchesUsed: updated.searches,
    searchesRemaining,
    leadsUsed: updated.leads,
    leadsRemaining,
    maxSearches,
    maxLeads,
    aiMessagesUsed: updated.aiMessages ?? 0,
    aiMessagesRemaining,
    maxAiMessages,
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
