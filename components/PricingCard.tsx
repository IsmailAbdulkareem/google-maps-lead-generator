"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanDefinition } from "@/lib/plans";

interface PricingCardProps {
  plan: PlanDefinition;
  isCurrent?: boolean;
  onSelect: (tier: string) => void;
  highlighted?: boolean;
}

export function PricingCard({
  plan,
  isCurrent,
  onSelect,
  highlighted,
}: PricingCardProps) {
  const isFree = plan.price === 0;

  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 ${
        highlighted
          ? "border-foreground/30 bg-foreground/[0.03] shadow-md"
          : "border-foreground/10"
      }`}
    >
      {highlighted && (
        <span className="mb-3 inline-block self-start rounded-full bg-foreground/10 px-3 py-0.5 text-xs font-medium text-foreground/70">
          Most Popular
        </span>
      )}
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold">
          {isFree ? "$0" : `$${plan.price}`}
        </span>
        {!isFree && <span className="text-sm text-foreground/50">/month</span>}
      </div>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-foreground/70">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant={isCurrent ? "outline" : "default"}
        size="lg"
        className="mt-8 w-full"
        disabled={isCurrent}
        onClick={() => onSelect(plan.tier)}
      >
        {isCurrent ? "Current Plan" : isFree ? "Get Started" : "Upgrade to Pro"}
      </Button>
    </div>
  );
}
