import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runLeadSearch, runMultiLeadSearch } from "@/lib/run-search";
import { checkLimits, recordUsage, capLeadsToRemaining } from "@/lib/usage-limits";
import { isUnlimited } from "@/lib/plans";

const searchSchema = z.object({
  category: z.string().min(1, "Category is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  targetLeads: z.number().int().min(1).max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limits = await checkLimits();

    if (!isUnlimited(limits.maxSearches) && limits.searchesRemaining <= 0) {
      return NextResponse.json(
        { error: "Daily search limit reached. Pro is coming soon.", limitType: "searches", usage: limits },
        { status: 429 }
      );
    }

    if (!isUnlimited(limits.maxLeads) && limits.leadsRemaining <= 0) {
      return NextResponse.json(
        { error: "Daily lead limit reached. Pro is coming soon.", limitType: "leads", usage: limits },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = searchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { targetLeads, ...params } = parsed.data;
    const maxResultsPerSearch = Number(process.env.MAX_RESULTS_PER_SEARCH) || 20;

    let result: { query: string; leads: Awaited<ReturnType<typeof runLeadSearch>>["leads"] };

    if (targetLeads && targetLeads > maxResultsPerSearch) {
      const maxSearches = Math.ceil(targetLeads / maxResultsPerSearch);
      result = await runMultiLeadSearch(params, {
        maxSearches: Math.min(maxSearches, 10),
      });
    } else {
      result = await runLeadSearch(params);
    }

    const cappedLeads = capLeadsToRemaining(result.leads, limits.leadsRemaining);
    const leadCount = cappedLeads.length;

    const updatedUsage = await recordUsage(userId, 1, leadCount);

    return NextResponse.json({
      query: result.query,
      leads: cappedLeads,
      meta: { total: leadCount, uncappedTotal: result.leads.length },
      usage: updatedUsage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
