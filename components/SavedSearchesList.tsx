"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { listSavedSearches, deleteSearch, type SavedSearchMeta } from "@/lib/local-storage";
import { useClientSnapshot, useIsClient } from "@/lib/use-client-storage";
import { Clock, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMPTY_SEARCHES: SavedSearchMeta[] = [];

export function SavedSearchesList() {
  const ready = useIsClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [keys, setKeys] = useState(0);
  const readSearches = useCallback(() => listSavedSearches(), [keys]);
  const searches = useClientSnapshot(readSearches, EMPTY_SEARCHES);

  function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this search from this device?")) return;
    setDeleting(id);
    deleteSearch(id);
    setDeleting(null);
    setKeys((k) => k + 1);
  }

  if (!ready || searches.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold">Saved on this device</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Past searches stored in your browser. Clearing site data removes them.
      </p>
      <ul className="mt-4 divide-y divide-foreground/10 rounded-xl border border-foreground/10">
        {searches.map((s) => (
          <li key={s.id} className="group relative">
            <Link
              href={`/leads/${s.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-foreground/[0.03]"
            >
              <div>
                <p className="font-medium">
                  {s.category} · {s.city}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground/50">
                  <Clock className="h-3 w-3" />
                  {new Date(s.createdAt).toLocaleString()} · {s.leadCount}{" "}
                  leads
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-foreground/40" />
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute right-12 top-1/2 -translate-y-1/2 gap-1 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDelete(e, s.id)}
              disabled={deleting === s.id}
            >
              {deleting === s.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
