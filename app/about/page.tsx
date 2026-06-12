import { MapPin, Search, BarChart3, Download } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">About Lead Generator</h1>
      <p className="mt-4 text-lg text-foreground/70">
        We help web agencies, freelancers, and digital marketers find local
        business leads that need websites, SEO, and digital services.
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 p-5">
          <Search className="h-5 w-5 text-foreground/60" />
          <h3 className="font-medium">Google Maps Search</h3>
          <p className="text-sm text-foreground/60">
            Search any business category in any city. We pull real businesses
            directly from Google Maps with contact details and ratings.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 p-5">
          <BarChart3 className="h-5 w-5 text-foreground/60" />
          <h3 className="font-medium">Lead Scoring</h3>
          <p className="text-sm text-foreground/60">
            Every lead is scored based on website status, online presence, and
            outreach potential so you can focus on the best prospects.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 p-5">
          <Download className="h-5 w-5 text-foreground/60" />
          <h3 className="font-medium">Export Anywhere</h3>
          <p className="text-sm text-foreground/60">
            Download your leads as CSV, PDF, Word, or JSON. Import them into
            your CRM, spreadsheet, or outreach tool.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 p-5">
          <MapPin className="h-5 w-5 text-foreground/60" />
          <h3 className="font-medium">Privacy First</h3>
          <p className="text-sm text-foreground/60">
            All search results are saved on your device only. We never store
            your leads on our servers.
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Start Finding Leads
        </Link>
      </div>
    </main>
  );
}
