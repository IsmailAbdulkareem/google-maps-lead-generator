"use client";

import { X, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-foreground/10 bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Free Limit Reached</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-foreground/50 hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm text-foreground/70">
          You&apos;ve used all free credits available on the Free plan.
          Pro subscriptions are coming soon.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Maybe Later
          </Button>
          <a
            href="mailto:hello@leadgenerator.app?subject=Pro%20Waitlist"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <Mail className="h-4 w-4" />
            Notify Me
          </a>
        </div>
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-foreground/50">
          <Clock className="h-3 w-3" />
          Pro launching soon — join the waitlist
        </div>
      </div>
    </div>
  );
}
