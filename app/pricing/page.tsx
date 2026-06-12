"use client";

import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
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

      <div className="mt-10">
        <PricingTable />
      </div>
    </main>
  );
}
