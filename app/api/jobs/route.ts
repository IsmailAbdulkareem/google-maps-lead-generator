import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createBulkSearchJob } from "@/lib/job-store";
import { checkLimits } from "@/lib/usage-limits";
import { hasProAiFeature, isUnlimited } from "@/lib/plans";

const jobSchema = z.object({
  category: z.string().min(1),
  city: z.string().min(1),
  area: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  targetCount: z.number().min(1).max(500).default(100),
  minScore: z.number().min(0).max(100).default(85),
  maxScore: z.number().min(0).max(100).default(100),
});

export async function POST(request: Request) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limits = await checkLimits();
    if (!hasProAiFeature(limits.tier, "Bulk search jobs")) {
      return NextResponse.json(
        { error: "Bulk search jobs require Pro plan." },
        { status: 403 }
      );
    }

    if (
      !isUnlimited(limits.maxSearches) &&
      limits.searchesRemaining <= 0
    ) {
      return NextResponse.json(
        { error: "Search limit reached." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = jobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const job = createBulkSearchJob({
      userId,
      params: {
        category: parsed.data.category,
        city: parsed.data.city,
        area: parsed.data.area,
        country: parsed.data.country,
        industry: parsed.data.industry,
      },
      targetCount: parsed.data.targetCount,
      minScore: parsed.data.minScore,
      maxScore: parsed.data.maxScore,
      maxSearches: isUnlimited(limits.maxSearches)
        ? 10
        : Math.min(limits.searchesRemaining, 10),
      leadsRemaining: limits.leadsRemaining,
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: "Bulk search job started.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
