import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { UsageIndicator } from "@/components/UsageIndicator";

const navLinkClass =
  "text-sm text-foreground/60 transition-colors hover:text-foreground";

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

        <nav className="hidden items-center gap-4 sm:flex">
          <Show when="signed-in">
            <Link href="/search" className={navLinkClass}>
              Manual Search
            </Link>
            <Link href="/chat" className={navLinkClass}>
              AI Assistant
            </Link>
          </Show>
          <Link href="/pricing" className={navLinkClass}>
            Pricing
          </Link>
          <Link href="/about" className={navLinkClass}>
            About
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href="https://github.com/IsmailAbdulkareem"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-foreground/60 transition-colors hover:text-foreground sm:block"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
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
