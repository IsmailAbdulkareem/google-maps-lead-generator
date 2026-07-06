"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Search, Clock, ChevronRight, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SavedSearchMeta {
  id: string;
  search_id: string;
  query: string;
  category: string;
  city: string;
  area: string | null;
  country: string | null;
  lead_count: number;
  created_at: string;
}

export function MyLeadsClient() {
  const [searches, setSearches] = useState<SavedSearchMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSearches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/my-leads");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSearches(data.searches ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  async function handleDelete(searchId: string) {
    if (!confirm("Delete this search and all its leads?")) return;
    setDeleting(searchId);
    try {
      await fetch("/api/my-leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchId }),
      });
      setSearches((prev) => prev.filter((s) => s.search_id !== searchId));
    } catch {
      setError("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your saved leads…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 text-center">
        <Search className="mx-auto mb-3 h-8 w-8 text-foreground/30" />
        <p className="text-foreground/70">No saved leads yet.</p>
        <p className="mt-1 text-sm text-foreground/50">
          Run a search and results will be saved here automatically.
        </p>
        <Link
          href="/search"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground/70 hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Go to Search
        </Link>
      </div>
    );
  }

  const totalLeads = searches.reduce((sum, s) => sum + s.lead_count, 0);

  return (
    <div>
      <p className="mb-4 text-sm text-foreground/50">
        {searches.length} search{searches.length !== 1 ? "es" : ""} · {totalLeads} total lead{totalLeads !== 1 ? "s" : ""}
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
        {searches.map((s) => (
          <div
            key={s.id}
            className="group flex items-center justify-between gap-4 px-4 py-3"
          >
            <Link
              href={`/leads/${s.search_id}`}
              className="flex min-w-0 flex-1 items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium">
                  {s.category} · {s.city}
                  {s.area ? ` · ${s.area}` : ""}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground/50">
                  <Clock className="h-3 w-3" />
                  {new Date(s.created_at).toLocaleString()} · {s.lead_count} leads
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-foreground/40" />
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(s.search_id)}
              disabled={deleting === s.search_id}
            >
              {deleting === s.search_id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
