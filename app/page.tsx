import { SearchForm } from "@/components/SearchForm";
import { SavedSearchesList } from "@/components/SavedSearchesList";
import { ProCta } from "@/components/ProCta";
import { MapPin, Search, BarChart3, Download, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-12 sm:px-6">
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-2 text-foreground/60">
          <MapPin className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">
            Local Business Lead Generator
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Find qualified leads from Google Maps
        </h1>
        <p className="mt-3 text-foreground/70">
          Discover local businesses, score prospects by online presence, and
          download leads as CSV, PDF, or Word — all saved on your device only.
        </p>
      </div>

      {/* Feature cards — visible on public homepage */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-foreground/10 p-4">
          <Search className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" />
          <div>
            <p className="text-sm font-medium">Google Maps Search</p>
            <p className="text-xs text-foreground/50">
              Search any category in any city
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-foreground/10 p-4">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" />
          <div>
            <p className="text-sm font-medium">Lead Scoring</p>
            <p className="text-xs text-foreground/50">
              Auto-scored by online presence
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-foreground/10 p-4">
          <Download className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" />
          <div>
            <p className="text-sm font-medium">Export Anywhere</p>
            <p className="text-xs text-foreground/50">
              CSV, PDF, Word, or JSON
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-foreground/10 p-4">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" />
          <div>
            <p className="text-sm font-medium">Privacy First</p>
            <p className="text-xs text-foreground/50">
              All data stays on your device
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 sm:p-8">
        <SearchForm />
      </div>

      <SavedSearchesList />

      <ProCta />
    </main>
  );
}
