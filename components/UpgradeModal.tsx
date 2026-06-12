"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function UpgradeModal({ open, onClose, onUpgrade }: UpgradeModalProps) {
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
          You have used all 5 searches and 25 leads available on the Free plan.
          Upgrade to Pro for continued access.
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
          <Button
            type="button"
            className="flex-1"
            onClick={onUpgrade}
          >
            Upgrade to Pro — $20/month
          </Button>
        </div>
      </div>
    </div>
  );
}
