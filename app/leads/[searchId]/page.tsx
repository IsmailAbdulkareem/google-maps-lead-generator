import { LeadsPageClient } from "@/components/LeadsPageClient";

export default async function LeadsPage({
  params,
}: {
  params: Promise<{ searchId: string }>;
}) {
  const { searchId } = await params;
  return <LeadsPageClient searchId={searchId} />;
}
