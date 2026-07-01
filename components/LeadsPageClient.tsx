"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { LeadsTable } from "@/components/LeadsTable";
import { deleteSearch, getSearch } from "@/lib/local-storage";
import { useClientSnapshot, useIsClient } from "@/lib/use-client-storage";
import { ArrowLeft, HardDrive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LeadsPageClient({ searchId }: { searchId: string }) {
  const router = useRouter();
  const ready = useIsClient();
  const readSearch = useCallback(() => getSearch(searchId), [searchId]);
  const search = useClientSnapshot(readSearch, null);

  function handleDelete() {
    if (!confirm("Delete this search from this device?")) return;
    deleteSearch(searchId);
    router.push("/");
  }

  if (!ready) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-sm text-foreground/60">Loading saved results…</p>
      </main>
    );
  }

  if (!search) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/search"
          className="mb-6 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          New search
        </Link>
        <p className="text-foreground/70">
          No saved results found on this device. Run a new search from the
          manual search page (results are stored in your browser only).
        </p>
      </main>
    );
  }

  const highCount = search.leads.filter((l) => l.priority === "high").length;
  const noWebsite = search.leads.filter(
    (l) => !l.website || l.websiteStatus === "none"
  ).length;
  const exportTitle = `${search.category} — ${search.city}`;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          New search
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 text-red-600 dark:text-red-400"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete from device
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Search results</h1>
        <p className="mt-1 text-foreground/60">
          {search.category} · {search.city}
          {search.area ? ` · ${search.area}` : ""}
          {search.country ? ` · ${search.country}` : ""}
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-foreground/50">
          <HardDrive className="h-3.5 w-3.5" />
          Saved on this device · {new Date(search.createdAt).toLocaleString()}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span>
            <strong>{search.leads.length}</strong> businesses
          </span>
          <span>
            <strong>{highCount}</strong> high priority
          </span>
          <span>
            <strong>{noWebsite}</strong> without website
          </span>
        </div>
      </div>

      <LeadsTable
        leads={search.leads}
        exportTitle={exportTitle}
        searchId={searchId}
      />
    </main>
  );
}
