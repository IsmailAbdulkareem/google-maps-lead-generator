export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-foreground/50">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="mt-8 space-y-8 text-foreground/70">
        <section>
          <h2 className="text-xl font-medium text-foreground">1. Information We Collect</h2>
          <p className="mt-3 text-sm leading-relaxed">
            When you use Lead Generator, we collect your email address and name
            through Clerk authentication. Search results and leads are stored
            locally on your device and are never transmitted to or stored on our
            servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground">2. How We Use Your Information</h2>
          <p className="mt-3 text-sm leading-relaxed">
            We use your email address solely for authentication and
            communication related to your account. We do not sell, share, or
            use your personal information for advertising purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground">3. Data Storage</h2>
          <p className="mt-3 text-sm leading-relaxed">
            All search results and lead data are stored in your browser&apos;s
            local storage. This data never leaves your device. We have no
            access to your saved searches or leads.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground">4. Third-Party Services</h2>
          <p className="mt-3 text-sm leading-relaxed">
            We use Clerk for authentication and Google Places API for business
            data. These services operate under their own privacy policies. We
            do not share your personal data with any third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground">5. Cookies</h2>
          <p className="mt-3 text-sm leading-relaxed">
            We use only essential cookies required for authentication via Clerk.
            We do not use tracking cookies or analytics cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground">6. Changes to This Policy</h2>
          <p className="mt-3 text-sm leading-relaxed">
            We may update this privacy policy from time to time. Any changes
            will be reflected on this page with an updated date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-foreground">7. Contact</h2>
          <p className="mt-3 text-sm leading-relaxed">
            If you have any questions about this privacy policy, please contact
            us at{" "}
            <a
              href="mailto:support@leadgenerator.app"
              className="underline underline-offset-2 hover:text-foreground"
            >
              support@leadgenerator.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
