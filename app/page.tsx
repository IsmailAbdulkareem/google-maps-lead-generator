import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import {
  MapPin,
  Search,
  Bot,
  BarChart3,
  Download,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { ProCta } from "@/components/ProCta";

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-4 flex items-center gap-2 text-foreground/60">
          <MapPin className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">
            Local Business Lead Generator
          </span>
        </div>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Find qualified leads from Google Maps
        </h1>
        <p className="mt-4 max-w-xl text-lg text-foreground/70">
          Discover local businesses, score prospects by online presence, and
          reach out with AI — your data stays on your device.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Show when="signed-in">
            <Link
              href="/search"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-base font-medium text-background transition-opacity hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              Manual Search
            </Link>
            <Link
              href="/chat"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-foreground/20 px-6 text-base font-medium transition-colors hover:bg-foreground/5"
            >
              <Bot className="h-4 w-4" />
              AI Assistant
            </Link>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-base font-medium text-background transition-opacity hover:opacity-90"
              >
                <Search className="h-4 w-4" />
                Get started
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignInButton>
          </Show>
        </div>
      </section>

      {/* Two ways to search */}
      <section className="border-y border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="text-xl font-semibold">Two ways to find leads</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Pick the workflow that fits you — or use both.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Link
              href="/search"
              className="group rounded-2xl border border-foreground/10 bg-background p-6 transition-colors hover:border-foreground/20"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Manual Search</h3>
              <p className="mt-2 text-sm text-foreground/60">
                Fill in category, city, and area. Get scored results in a table
                with CSV, PDF, and Word export.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground/70 group-hover:text-foreground">
                Open search form
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            <Link
              href="/chat"
              className="group rounded-2xl border border-foreground/10 bg-background p-6 transition-colors hover:border-foreground/20"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="mt-2 text-sm text-foreground/60">
                Describe what you need in plain English. The AI searches, filters
                high-score leads, and drafts outreach messages.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground/70 group-hover:text-foreground">
                Start chatting
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-xl font-semibold">Everything you need</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Search,
              title: "Google Maps Search",
              desc: "Any category in any city",
            },
            {
              icon: BarChart3,
              title: "Lead Scoring",
              desc: "Auto-scored 0–100",
            },
            {
              icon: Sparkles,
              title: "AI Outreach",
              desc: "Personalized messages",
            },
            {
              icon: Download,
              title: "Export Anywhere",
              desc: "CSV, PDF, Word, JSON",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-xl border border-foreground/10 p-4"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" />
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-foreground/50">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
        <ProCta />
      </div>
    </main>
  );
}
