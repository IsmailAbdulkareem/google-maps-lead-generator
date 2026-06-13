"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { WaitlistModal } from "@/components/WaitlistModal";

export function ProCta() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <>
      <div className="mt-10 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 text-center">
        <h2 className="text-lg font-semibold">Pro is Coming Soon</h2>
        <p className="mt-2 text-sm text-foreground/60">
          Get 50 searches/day, 500 leads/day, and premium exports.
          Join the waitlist for early access.
        </p>
        <button
          type="button"
          onClick={() => setShowWaitlist(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <Mail className="h-4 w-4" />
          Notify Me
        </button>
      </div>

      <WaitlistModal
        open={showWaitlist}
        onClose={() => setShowWaitlist(false)}
      />
    </>
  );
}
