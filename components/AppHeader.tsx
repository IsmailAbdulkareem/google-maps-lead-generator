import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { UsageIndicator } from "@/components/UsageIndicator";

export function AppHeader() {
  return (
    <header className="border-b border-foreground/10 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">Lead Generator</span>
        </Link>

        <div className="flex shrink-0 items-center gap-3">
          <Show when="signed-in">
            <UsageIndicator />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-foreground/5"
              >
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
