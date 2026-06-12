import Link from "next/link";
import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 bg-background/80">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            <MapPin className="h-4 w-4" />
            <span>Lead Generator</span>
          </Link>
          <p className="max-w-xs text-xs text-foreground/50">
            Find and qualify local business leads from Google Maps for web and
            digital services.
          </p>
        </div>

        <div className="flex flex-wrap gap-10 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-medium text-foreground/70">Product</span>
            <Link href="/pricing" className="text-foreground/50 hover:text-foreground">
              Pricing
            </Link>
            <Link href="/" className="text-foreground/50 hover:text-foreground">
              Search Leads
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium text-foreground/70">Company</span>
            <Link href="/about" className="text-foreground/50 hover:text-foreground">
              About
            </Link>
            <Link href="/contact" className="text-foreground/50 hover:text-foreground">
              Contact
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium text-foreground/70">Legal</span>
            <Link href="/privacy" className="text-foreground/50 hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-foreground/5 px-4 py-4 text-center text-xs text-foreground/40">
        &copy; {new Date().getFullYear()} Lead Generator. All rights reserved.
      </div>
    </footer>
  );
}
