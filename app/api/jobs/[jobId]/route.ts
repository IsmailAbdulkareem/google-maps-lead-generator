import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getJob } from "@/lib/job-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const job = getJob(jobId, userId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      targetCount: job.targetCount,
      minScore: job.minScore,
      maxScore: job.maxScore,
      leads: job.status === "completed" ? job.leads : [],
      leadCount: job.leads.length,
      searchesRun: job.searchesRun,
      error: job.error,
      searchId: job.status === "completed" ? job.id : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
