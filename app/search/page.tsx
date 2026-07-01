import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { SavedSearchesList } from "@/components/SavedSearchesList";
import { Bot, Search, ArrowLeft } from "lucide-react";

export default function SearchPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-foreground/60">
          <Search className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">
            Manual Search
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Search Google Maps
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Enter category and location to find and score local business leads.
        </p>
        <Link
          href="/chat"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground"
        >
          <Bot className="h-3.5 w-3.5" />
          Prefer natural language? Try the AI assistant
        </Link>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 sm:p-8">
        <SearchForm />
      </div>

      <SavedSearchesList />
    </main>
  );
}
