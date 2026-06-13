"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, Mail } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { WaitlistModal } from "@/components/WaitlistModal";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const free = PLANS.free;
  const pro = PLANS.pro;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Simple Pricing
        </h1>
        <p className="mt-3 text-foreground/60">
          Start free, scale as you grow. No hidden fees.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {/* Free Plan */}
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <h2 className="text-lg font-semibold">{free.name}</h2>
          <p className="mt-1 text-sm text-foreground/60">
            {free.searchesPerDay} searches &middot; {free.leadsPerDay} leads (one-time trial)
          </p>
          <div className="mt-4 text-2xl font-bold">$0</div>
          <p className="text-xs text-foreground/50">Free forever</p>
          <ul className="mt-6 space-y-3">
            {free.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Get Started
          </Link>
        </div>

        {/* Pro Plan — Coming Soon */}
        <div className="relative rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <div className="absolute -top-3 right-4 rounded-full bg-foreground px-3 py-0.5 text-xs font-medium text-background">
            Coming Soon
          </div>
          <h2 className="text-lg font-semibold">{pro.name}</h2>
          <p className="mt-1 text-sm text-foreground/60">
            {pro.searchesPerDay} searches/day &middot; {pro.leadsPerDay} leads/day
          </p>
          <div className="mt-4 text-2xl font-bold">${pro.price}<span className="text-sm font-normal text-foreground/50">/month</span></div>
          <p className="text-xs text-foreground/50">Billed ${pro.yearlyPrice}/year</p>
          <ul className="mt-6 space-y-3">
            {pro.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="button"
              className="w-full gap-2"
              onClick={() => setShowWaitlist(true)}
            >
              <Mail className="h-4 w-4" />
              Notify Me
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-foreground/50">
              <Clock className="h-3 w-3" />
              Launching soon — join the waitlist
            </div>
          </div>
        </div>
      </div>

      <WaitlistModal
        open={showWaitlist}
        onClose={() => setShowWaitlist(false)}
      />
    </main>
  );
}
