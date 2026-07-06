"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSearchId, saveSearch } from "@/lib/local-storage";
import { useUsageStats } from "@/components/UsageIndicator";
import { UpgradeModal } from "@/components/UpgradeModal";
import { WaitlistModal } from "@/components/WaitlistModal";
import { isUnlimited } from "@/lib/plans";
import { notifyUsageUpdated } from "@/lib/usage-events";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LEAD_COUNT_OPTIONS = [
  { label: "5 leads", value: 5 },
  { label: "10 leads", value: 10 },
  { label: "20 leads", value: 20 },
  { label: "50 leads", value: 50 },
  { label: "100 leads", value: 100 },
  { label: "Max", value: 0 },
];

export function SearchForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [country, setCountry] = useState("");
  const [targetLeads, setTargetLeads] = useState(10);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  const { stats, loading: usageLoading, refresh: refreshUsage } = useUsageStats();

  const searchesExhausted = stats
    ? !isUnlimited(stats.maxSearches) && stats.searchesRemaining <= 0
    : false;
  const leadsExhausted = stats
    ? !isUnlimited(stats.maxLeads) && stats.leadsRemaining <= 0
    : false;
  const limitsReached = searchesExhausted || leadsExhausted;

  const effectiveLeadLimit = stats && !isUnlimited(stats.maxLeads)
    ? Math.min(stats.leadsRemaining, targetLeads === 0 ? stats.maxLeads : targetLeads)
    : targetLeads === 0 ? 100 : targetLeads;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const params = {
      category,
      industry: industry || undefined,
      city,
      area: area || undefined,
      country: country || undefined,
    };

    try {
      const target = targetLeads === 0
        ? (stats ? (isUnlimited(stats.maxLeads) ? 100 : stats.leadsRemaining) : 25)
        : targetLeads;

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, targetLeads: target }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data.usage) {
          refreshUsage();
          notifyUsageUpdated();
          setShowUpgrade(true);
        }
        throw new Error(data.error ?? "Search failed");
      }

      refreshUsage();
      notifyUsageUpdated();

      const id = createSearchId();
      const savedSearch = {
        id,
        query: data.query,
        category,
        city,
        area: area || undefined,
        country: country || undefined,
        createdAt: new Date().toISOString(),
        leadCount: data.leads.length,
        params,
        leads: data.leads,
      };

      saveSearch(savedSearch);

      setSaving(true);
      try {
        const saveRes = await fetch("/api/save-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchId: id,
            query: data.query,
            params,
            leads: data.leads,
          }),
        });
        if (!saveRes.ok) {
          const saveData = await saveRes.json();
          console.warn("Supabase save failed:", saveData.error);
        }
      } catch (saveErr) {
        console.warn("Supabase save error:", saveErr);
      }
      setSaving(false);

      router.push(`/leads/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      refreshUsage();
      notifyUsageUpdated();
    } finally {
      setLoading(false);
      setSaving(false);
    }
  }

  const tierLabel = stats?.tier === "free" ? "Free" : stats?.tier === "pro" ? "Pro" : null;

  const limitWarning = stats
    ? searchesExhausted
      ? "Daily search limit reached — Pro is coming soon."
      : leadsExhausted
        ? "Daily lead limit reached — Pro is coming soon."
        : !isUnlimited(stats.maxSearches) && stats.searchesRemaining <= 2
          ? `Only ${stats.searchesRemaining} search(es) remaining today.`
          : !isUnlimited(stats.maxLeads) && stats.leadsRemaining <= 5
            ? `Only ${stats.leadsRemaining} leads can be viewed this search.`
            : null
    : null;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Business category *
            </label>
            <Input
              id="category"
              placeholder="e.g. Gym, Restaurant, Dentist"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="industry" className="text-sm font-medium">
              Industry (optional)
            </label>
            <Input
              id="industry"
              placeholder="e.g. Fitness, Healthcare"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="city" className="text-sm font-medium">
              City *
            </label>
            <Input
              id="city"
              placeholder="e.g. Karachi"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="area" className="text-sm font-medium">
              Area (optional)
            </label>
            <Input
              id="area"
              placeholder="e.g. DHA, Gulberg"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="country" className="text-sm font-medium">
              Country (optional)
            </label>
            <Input
              id="country"
              placeholder="e.g. Pakistan"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>

        {/* Lead count selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Desired leads</label>
          <div className="flex flex-wrap gap-2">
            {LEAD_COUNT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTargetLeads(opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  targetLeads === opt.value
                    ? "border-foreground/30 bg-foreground/10 font-medium text-foreground"
                    : "border-foreground/10 text-foreground/60 hover:border-foreground/20 hover:text-foreground/80"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-foreground/50">
            {effectiveLeadLimit > 0
              ? `Will attempt up to ${effectiveLeadLimit} leads`
              : "Will use your remaining daily lead quota"}
          </p>
        </div>

        <p className="text-xs text-foreground/50">
          Results saved to your account (cloud) and this device. Export as CSV,
          PDF, Word, or JSON anytime.
        </p>

        {stats && (
          <div className="flex items-center gap-3 text-xs">
            {tierLabel && (
              <span className="font-medium text-foreground/70">{tierLabel}</span>
            )}
            <span className="text-foreground/20">|</span>
            <span
              className={
                isUnlimited(stats.maxSearches)
                  ? "text-foreground/60"
                  : stats.searchesRemaining === 0
                    ? "text-red-600 dark:text-red-400 font-medium"
                    : stats.searchesRemaining <= 2
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-foreground/60"
              }
            >
              {isUnlimited(stats.maxSearches)
                ? "∞ searches"
                : `${stats.searchesRemaining}/${stats.maxSearches} searches remaining`}
            </span>
            <span className="text-foreground/30">·</span>
            <span
              className={
                isUnlimited(stats.maxLeads)
                  ? "text-foreground/60"
                  : stats.leadsRemaining === 0
                    ? "text-red-600 dark:text-red-400 font-medium"
                    : stats.leadsRemaining <= 5
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-foreground/60"
              }
            >
              {isUnlimited(stats.maxLeads)
                ? "∞ leads"
                : `${stats.leadsRemaining}/${stats.maxLeads} leads remaining`}
            </span>
          </div>
        )}

        {limitWarning && (
          <p className="rounded-lg bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
            {limitWarning}
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || limitsReached || usageLoading}
          size="lg"
          className="gap-2"
        >
          {loading || saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {loading
            ? "Searching…"
            : saving
              ? "Saving leads…"
              : limitsReached
                ? "Daily limit reached"
                : "Search Maps"}
        </Button>
      </form>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onNotify={() => { setShowUpgrade(false); setShowWaitlist(true); }}
      />

      <WaitlistModal
        open={showWaitlist}
        onClose={() => setShowWaitlist(false)}
      />
    </>
  );
}
