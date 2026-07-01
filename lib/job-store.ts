import { runMultiLeadSearch } from "./run-search";
import { filterLeadsByScore } from "./lead-filters";
import { capLeadsToRemaining, recordUsage } from "./usage-limits";
import { buildServerSearch, saveServerSearch } from "./search-store";
import type { BulkSearchJob, SearchParams } from "./types";

const jobs = new Map<string, BulkSearchJob>();
const TTL_MS = 2 * 60 * 60 * 1000;

function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - new Date(job.createdAt).getTime() > TTL_MS) {
      jobs.delete(id);
    }
  }
}

export function getJob(jobId: string, userId: string): BulkSearchJob | null {
  cleanupExpired();
  const job = jobs.get(jobId);
  if (!job || job.userId !== userId) return null;
  return job;
}

export function createBulkSearchJob(input: {
  userId: string;
  params: SearchParams;
  targetCount: number;
  minScore: number;
  maxScore: number;
  maxSearches: number;
  leadsRemaining: number;
}): BulkSearchJob {
  cleanupExpired();
  const job: BulkSearchJob = {
    id: crypto.randomUUID(),
    userId: input.userId,
    status: "pending",
    params: input.params,
    targetCount: input.targetCount,
    minScore: input.minScore,
    maxScore: input.maxScore,
    leads: [],
    searchesRun: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.set(job.id, job);

  runJobAsync(job.id, input.maxSearches, input.leadsRemaining);

  return job;
}

async function runJobAsync(
  jobId: string,
  maxSearches: number,
  leadsRemaining: number
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = "running";
  job.updatedAt = new Date().toISOString();

  try {
    const result = await runMultiLeadSearch(job.params, {
      maxSearches,
      onProgress: (info) => {
        const j = jobs.get(jobId);
        if (!j) return;
        j.searchesRun = info.searchesRun;
        j.updatedAt = new Date().toISOString();
      },
    });

    let filtered = filterLeadsByScore(result.leads, {
      minScore: job.minScore,
      maxScore: job.maxScore,
      limit: job.targetCount,
    });

    filtered = capLeadsToRemaining(filtered, leadsRemaining);

    const j = jobs.get(jobId);
    if (!j) return;

    j.leads = filtered;
    j.searchesRun = result.searchesRun;
    j.status = "completed";
    j.updatedAt = new Date().toISOString();

    const saved = buildServerSearch(
      j.userId,
      j.params,
      result.query,
      filtered
    );
    saveServerSearch({ ...saved, id: j.id });

    if (j.searchesRun > 0) {
      await recordUsage(j.userId, j.searchesRun, j.leads.length);
    }
  } catch (error) {
    const j = jobs.get(jobId);
    if (!j) return;
    j.status = "failed";
    j.error = error instanceof Error ? error.message : "Job failed";
    j.updatedAt = new Date().toISOString();
  }
}
