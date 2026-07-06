import { MyLeadsClient } from "@/components/MyLeadsClient";

export const metadata = {
  title: "My Leads - Lead Generator",
  description: "View your saved leads across all searches.",
};

export default function MyLeadsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">My Leads</h1>
        <p className="mt-1 text-sm text-foreground/60">
          All your saved leads across searches, stored in the cloud.
        </p>
      </div>
      <MyLeadsClient />
    </main>
  );
}
