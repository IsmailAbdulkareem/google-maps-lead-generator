"use client";

import Link from "next/link";
import { useCallback } from "react";
import { listSavedSearches, type SavedSearchMeta } from "@/lib/local-storage";
import { useClientSnapshot, useIsClient } from "@/lib/use-client-storage";
import { Clock, ChevronRight } from "lucide-react";

const EMPTY_SEARCHES: SavedSearchMeta[] = [];

export function SavedSearchesList() {
  const ready = useIsClient();
  const readSearches = useCallback(() => listSavedSearches(), []);
  const searches = useClientSnapshot(readSearches, EMPTY_SEARCHES);

  if (!ready || searches.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold">Saved on this device</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Past searches stored in your browser. Clearing site data removes them.
      </p>
      <ul className="mt-4 divide-y divide-foreground/10 rounded-xl border border-foreground/10">
        {searches.map((s) => (
          <li key={s.id}>
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
          </li>
        ))}
      </ul>
    </section>
  );
}
