"use client";

import { useEffect, useState, useCallback } from "react";
import type { UsageStats } from "@/lib/types";

export function UsageIndicator() {
  const [stats, setStats] = useState<UsageStats | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data: UsageStats = await res.json();
        setStats(data);
      }
    } catch {
      // Silently ignore — usage display is non-critical
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (!stats) return null;

  const searchColor =
    stats.searchesRemaining === 0
      ? "text-red-600 dark:text-red-400"
      : stats.searchesRemaining <= 2
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-emerald-600 dark:text-emerald-400";

  const leadColor =
    stats.leadsRemaining === 0
      ? "text-red-600 dark:text-red-400"
      : stats.leadsRemaining <= 5
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className={searchColor}>
        {stats.searchesRemaining}/{stats.maxSearches} searches
      </span>
      <span className="text-foreground/30">·</span>
      <span className={leadColor}>
        {stats.leadsRemaining}/{stats.maxLeads} leads
      </span>
    </div>
  );
}

/** Hook to fetch and refresh usage stats — shared between UsageIndicator and SearchForm. */
export function useUsageStats() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data: UsageStats = await res.json();
        setStats(data);
      }
    } catch {
      // Silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { stats, loading, refresh: fetchUsage };
}