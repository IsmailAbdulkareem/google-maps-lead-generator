"use client";

import { useEffect, useState, useCallback } from "react";
import type { UsageStats, PlanTier } from "@/lib/types";
import { isUnlimited } from "@/lib/plans";

interface UsageData extends UsageStats {
  tier: PlanTier;
  exportFormats: string[];
}

async function fetchUsageData(): Promise<UsageData | null> {
  try {
    const res = await fetch("/api/usage");
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Silently ignore — usage display is non-critical
  }
  return null;
}

export function UsageIndicator() {
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchUsageData().then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  const tierLabel = data.tier === "free" ? "Free" : "Pro";
  const tierColor = data.tier === "pro"
    ? "text-blue-600 dark:text-blue-400"
    : "text-foreground/50";

  const searchColor = isUnlimited(data.maxSearches)
    ? "text-emerald-600 dark:text-emerald-400"
    : data.searchesRemaining === 0
      ? "text-red-600 dark:text-red-400"
      : data.searchesRemaining <= 2
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-emerald-600 dark:text-emerald-400";

  const leadColor = isUnlimited(data.maxLeads)
    ? "text-emerald-600 dark:text-emerald-400"
    : data.leadsRemaining === 0
      ? "text-red-600 dark:text-red-400"
      : data.leadsRemaining <= 5
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className={`font-medium ${tierColor}`}>{tierLabel}</span>
      <span className="text-foreground/20">|</span>
      <span className={searchColor}>
        {isUnlimited(data.maxSearches)
          ? "∞ searches"
          : `${data.searchesRemaining}/${data.maxSearches} searches`}
      </span>
      <span className="text-foreground/30">·</span>
      <span className={leadColor}>
        {isUnlimited(data.maxLeads)
          ? "∞ leads"
          : `${data.leadsRemaining}/${data.maxLeads} leads`}
      </span>
    </div>
  );
}

/** Hook to fetch and refresh usage stats — shared between UsageIndicator and SearchForm. */
export function useUsageStats() {
  const [stats, setStats] = useState<(UsageStats & { tier: PlanTier; exportFormats: string[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    const result = await fetchUsageData();
    if (result) setStats(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchUsageData().then((result) => {
      if (!cancelled) {
        if (result) setStats(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, refresh: fetchUsage };
}
