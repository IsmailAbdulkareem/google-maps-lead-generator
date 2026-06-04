import { SearchForm } from "@/components/SearchForm";
import { SavedSearchesList } from "@/components/SavedSearchesList";
import { MapPin } from "lucide-react";

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

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 sm:p-8">
        <SearchForm />
      </div>

      <SavedSearchesList />

      <p className="mt-8 text-center text-xs text-foreground/40">
        Outreach drafts (email, WhatsApp, audits) —{" "}
        <span className="text-foreground/60">coming in v2</span>
      </p>
    </main>
  );
}
