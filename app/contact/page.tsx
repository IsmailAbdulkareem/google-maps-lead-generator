import { Mail, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Contact Us</h1>
      <p className="mt-4 text-lg text-foreground/70">
        Have a question, feedback, or need help? We&apos;d love to hear from you.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 p-6">
          <Mail className="h-5 w-5 text-foreground/60" />
          <h3 className="font-medium">Email</h3>
          <p className="text-sm text-foreground/60">
            Reach us at{" "}
            <a
              href="mailto:ismail233290@gmail.com"
              className="text-foreground underline underline-offset-2 hover:text-foreground/80"
            >
              ismail233290@gmail.com
            </a>
          </p>
          <p className="text-xs text-foreground/40">
            We typically respond within 24 hours.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-foreground/10 p-6">
          <Phone className="h-5 w-5 text-foreground/60" />
          <h3 className="font-medium">Phone</h3>
          <p className="text-sm text-foreground/60">
            Call us at{" "}
            <a
              href="tel:+923279671138"
              className="text-foreground underline underline-offset-2 hover:text-foreground/80"
            >
              +92 327 967 1138
            </a>
          </p>
          <p className="text-xs text-foreground/40">
            Available during business hours.
          </p>
        </div>
      </div>
    </main>
  );
}
