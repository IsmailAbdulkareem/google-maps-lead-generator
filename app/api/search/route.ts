import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runLeadSearch } from "@/lib/run-search";
import { checkLimits, recordUsage, capLeadsToRemaining } from "@/lib/usage-limits";

const searchSchema = z.object({
  category: z.string().min(1, "Category is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Enforce daily usage limits ──
    const limits = await checkLimits(userId);

    if (limits.searchesRemaining <= 0) {
      return NextResponse.json(
        {
          error: "Daily search limit reached. Resets at midnight UTC.",
          limitType: "searches",
          usage: limits,
        },
        { status: 429 }
      );
    }

    if (limits.leadsRemaining <= 0) {
      return NextResponse.json(
        {
          error: "Daily lead limit reached. Resets at midnight UTC.",
          limitType: "leads",
          usage: limits,
        },
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

    const result = await runLeadSearch(parsed.data);

    // Cap leads to remaining daily quota
    const cappedLeads = capLeadsToRemaining(result.leads, limits.leadsRemaining);
    const leadCount = cappedLeads.length;

    // Record usage: 1 search + however many leads were returned
    const updatedUsage = await recordUsage(userId, 1, leadCount);

    return NextResponse.json({
      query: result.query,
      leads: cappedLeads,
      meta: { total: leadCount, uncappedTotal: result.leads.length },
      usage: updatedUsage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
