import { z } from "zod";
import { runLeadSearch, runMultiLeadSearch } from "../run-search";
import { filterLeadsByScore } from "../lead-filters";
import {
  checkLimits,
  recordUsage,
  capLeadsToRemaining,
  type FullUsageStats,
} from "../usage-limits";
import { isUnlimited, hasProAiFeature } from "../plans";
import {
  buildServerSearch,
  saveServerSearch,
  getServerSearch,
  createServerSearchId,
} from "../search-store";
import { createBulkSearchJob } from "../job-store";
import { explainLeadScore } from "../groq/score-explain";
import { draftOutreachMessage } from "../groq/outreach";
import type { ScoredLead, SearchParams } from "../types";
import type { ChatCompletionTool } from "groq-sdk/resources/chat/completions";

/** Session context passed to tool executors during a chat turn. */
export interface ToolContext {
  userId: string;
  sessionLeads: ScoredLead[];
  sessionSearchId: string | null;
  limits: FullUsageStats;
}

export type ToolEvent =
  | { type: "tool_start"; name: string; args: unknown }
  | { type: "tool_result"; name: string; result: unknown }
  | { type: "leads"; searchId: string; leads: ScoredLead[]; query: string }
  | { type: "job_started"; jobId: string }
  | { type: "error"; message: string };

const searchLeadsSchema = z.object({
  category: z.string().min(1),
  city: z.string().min(1),
  area: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
});

const filterLeadsSchema = z.object({
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  weakDigitalPresenceOnly: z.boolean().optional(),
  limit: z.number().min(1).max(500).optional(),
});

const bulkSearchSchema = z.object({
  category: z.string().min(1),
  city: z.string().min(1),
  area: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  targetCount: z.number().min(1).max(500).default(100),
  minScore: z.number().min(0).max(100).default(85),
  maxScore: z.number().min(0).max(100).default(100),
  async: z.boolean().optional(),
});

const explainScoreSchema = z.object({
  placeId: z.string().optional(),
  businessName: z.string().optional(),
});

const draftOutreachSchema = z.object({
  placeId: z.string().optional(),
  businessName: z.string().optional(),
  userService: z.string().min(1),
  channel: z.enum(["email", "sms", "linkedin"]).default("email"),
  tone: z.enum(["professional", "friendly", "direct"]).optional(),
  language: z.string().optional(),
});

export const MCP_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_usage_stats",
      description:
        "Get the user's current plan tier and remaining search, lead, and AI message quotas.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "search_leads",
      description:
        "Search Google Maps for local businesses, score them, and analyze websites. Returns up to 20 leads per call.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Business type e.g. dentist, gym" },
          city: { type: "string", description: "City name" },
          area: { type: "string", description: "Optional neighborhood or area" },
          country: { type: "string", description: "Optional country" },
          industry: { type: "string", description: "Optional industry" },
        },
        required: ["category", "city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_leads_bulk",
      description:
        "Run multiple searches to collect many leads, then filter by score range. Use when user wants 50-100+ leads or score 85-100.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          city: { type: "string" },
          area: { type: "string" },
          country: { type: "string" },
          industry: { type: "string" },
          targetCount: { type: "number", description: "Desired number of qualified leads" },
          minScore: { type: "number", description: "Minimum lead score (default 85)" },
          maxScore: { type: "number", description: "Maximum lead score (default 100)" },
          async: {
            type: "boolean",
            description: "If true, start background job and return job ID for polling",
          },
        },
        required: ["category", "city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filter_leads",
      description:
        "Filter the current session leads by score, priority, or digital presence flags.",
      parameters: {
        type: "object",
        properties: {
          minScore: { type: "number" },
          maxScore: { type: "number" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          weakDigitalPresenceOnly: { type: "boolean" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "explain_lead_score",
      description:
        "Explain why a lead received its score and suggest a pitch angle. Pro feature.",
      parameters: {
        type: "object",
        properties: {
          placeId: { type: "string" },
          businessName: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_outreach_message",
      description:
        "Generate a personalized outreach message for a specific lead. Pro feature.",
      parameters: {
        type: "object",
        properties: {
          placeId: { type: "string" },
          businessName: { type: "string" },
          userService: { type: "string", description: "What the user is selling" },
          channel: { type: "string", enum: ["email", "sms", "linkedin"] },
          tone: { type: "string", enum: ["professional", "friendly", "direct"] },
          language: { type: "string" },
        },
        required: ["userService"],
      },
    },
  },
];

function findLead(
  ctx: ToolContext,
  placeId?: string,
  businessName?: string
): ScoredLead | null {
  if (placeId) {
    return ctx.sessionLeads.find((l) => l.placeId === placeId) ?? null;
  }
  if (businessName) {
    const lower = businessName.toLowerCase();
    return (
      ctx.sessionLeads.find((l) =>
        l.businessName.toLowerCase().includes(lower)
      ) ?? null
    );
  }
  return ctx.sessionLeads[0] ?? null;
}

async function executeSearch(
  ctx: ToolContext,
  params: SearchParams,
  onEvent: (e: ToolEvent) => void
): Promise<{
  searchId: string;
  leads: ScoredLead[];
  query: string;
  totalFound: number;
}> {
  const limits = await checkLimits();

  if (
    !isUnlimited(limits.maxSearches) &&
    limits.searchesRemaining <= 0
  ) {
    throw new Error("Search limit reached. Upgrade to Pro for more searches.");
  }
  if (!isUnlimited(limits.maxLeads) && limits.leadsRemaining <= 0) {
    throw new Error("Lead limit reached. Upgrade to Pro for more leads.");
  }

  const result = await runLeadSearch(params);
  const capped = capLeadsToRemaining(result.leads, limits.leadsRemaining);
  const searchId = createServerSearchId();

  const saved = buildServerSearch(
    ctx.userId,
    params,
    result.query,
    capped
  );
  saveServerSearch({ ...saved, id: searchId });

  await recordUsage(ctx.userId, 1, capped.length);

  ctx.sessionLeads = capped;
  ctx.sessionSearchId = searchId;

  onEvent({
    type: "leads",
    searchId,
    leads: capped,
    query: result.query,
  });

  return {
    searchId,
    leads: capped,
    query: result.query,
    totalFound: capped.length,
  };
}

export async function executeTool(
  name: string,
  args: unknown,
  ctx: ToolContext,
  onEvent: (e: ToolEvent) => void
): Promise<unknown> {
  onEvent({ type: "tool_start", name, args });

  try {
    let result: unknown;

    switch (name) {
      case "get_usage_stats": {
        result = await checkLimits();
        break;
      }

      case "search_leads": {
        const parsed = searchLeadsSchema.parse(args);
        result = await executeSearch(ctx, parsed, onEvent);
        break;
      }

      case "search_leads_bulk": {
        const parsed = bulkSearchSchema.parse(args);
        const limits = await checkLimits();

        if (
          !isUnlimited(limits.maxSearches) &&
          limits.searchesRemaining <= 0
        ) {
          throw new Error("Search limit reached.");
        }

        if (parsed.async && hasProAiFeature(limits.tier, "Bulk search jobs")) {
          const job = createBulkSearchJob({
            userId: ctx.userId,
            params: {
              category: parsed.category,
              city: parsed.city,
              area: parsed.area,
              country: parsed.country,
              industry: parsed.industry,
            },
            targetCount: parsed.targetCount,
            minScore: parsed.minScore,
            maxScore: parsed.maxScore,
            maxSearches: isUnlimited(limits.maxSearches)
              ? 10
              : Math.min(limits.searchesRemaining, 10),
            leadsRemaining: limits.leadsRemaining,
          });
          onEvent({ type: "job_started", jobId: job.id });
          result = {
            jobId: job.id,
            status: job.status,
            message: `Bulk search started. Poll GET /api/jobs/${job.id} for progress.`,
          };
          break;
        }

        const maxSearches = isUnlimited(limits.maxSearches)
          ? 10
          : Math.min(limits.searchesRemaining, 10);

        const multi = await runMultiLeadSearch(
          {
            category: parsed.category,
            city: parsed.city,
            area: parsed.area,
            country: parsed.country,
            industry: parsed.industry,
          },
          { maxSearches }
        );

        let filtered = filterLeadsByScore(multi.leads, {
          minScore: parsed.minScore,
          maxScore: parsed.maxScore,
          limit: parsed.targetCount,
        });
        filtered = capLeadsToRemaining(filtered, limits.leadsRemaining);

        const searchId = createServerSearchId();
        const saved = buildServerSearch(
          ctx.userId,
          {
            category: parsed.category,
            city: parsed.city,
            area: parsed.area,
            country: parsed.country,
            industry: parsed.industry,
          },
          multi.query,
          filtered
        );
        saveServerSearch({ ...saved, id: searchId });

        await recordUsage(ctx.userId, multi.searchesRun, filtered.length);

        ctx.sessionLeads = filtered;
        ctx.sessionSearchId = searchId;

        onEvent({
          type: "leads",
          searchId,
          leads: filtered,
          query: multi.query,
        });

        result = {
          searchId,
          leads: filtered.map(summarizeLead),
          totalFound: filtered.length,
          searchesRun: multi.searchesRun,
          avgScore:
            filtered.length > 0
              ? Math.round(
                  filtered.reduce((s, l) => s + l.leadScore, 0) /
                    filtered.length
                )
              : 0,
          message:
            filtered.length < parsed.targetCount
              ? `Found ${filtered.length} leads matching score ${parsed.minScore}-${parsed.maxScore}. Could not reach target of ${parsed.targetCount} — try a broader city or lower minScore.`
              : `Found ${filtered.length} qualified leads.`,
        };
        break;
      }

      case "filter_leads": {
        const parsed = filterLeadsSchema.parse(args);
        if (ctx.sessionLeads.length === 0) {
          throw new Error(
            "No leads in session. Run search_leads or search_leads_bulk first."
          );
        }
        const filtered = filterLeadsByScore(ctx.sessionLeads, parsed);
        ctx.sessionLeads = filtered;
        result = {
          leads: filtered.map(summarizeLead),
          filteredCount: filtered.length,
          droppedCount: 0,
        };
        break;
      }

      case "explain_lead_score": {
        const limits = await checkLimits();
        if (!hasProAiFeature(limits.tier, "Score explanations")) {
          throw new Error(
            "Score explanations require Pro plan. Upgrade to unlock this feature."
          );
        }
        const parsed = explainScoreSchema.parse(args);
        const lead = findLead(ctx, parsed.placeId, parsed.businessName);
        if (!lead) {
          throw new Error("Lead not found in current session. Search first.");
        }
        result = await explainLeadScore(lead);
        break;
      }

      case "draft_outreach_message": {
        const limits = await checkLimits();
        if (
          !hasProAiFeature(limits.tier, "Personalized outreach drafts")
        ) {
          throw new Error(
            "Personalized outreach requires Pro plan. Upgrade to unlock this feature."
          );
        }
        const parsed = draftOutreachSchema.parse(args);
        const lead = findLead(ctx, parsed.placeId, parsed.businessName);
        if (!lead) {
          throw new Error("Lead not found in current session. Search first.");
        }
        result = await draftOutreachMessage({
          lead,
          userService: parsed.userService,
          channel: parsed.channel,
          tone: parsed.tone,
          language: parsed.language,
          includeSubject: parsed.channel === "email",
        });
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    onEvent({ type: "tool_result", name, result });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool failed";
    onEvent({ type: "error", message });
    throw error;
  }
}

function summarizeLead(lead: ScoredLead) {
  return {
    placeId: lead.placeId,
    businessName: lead.businessName,
    category: lead.category,
    city: lead.city,
    rating: lead.rating,
    reviews: lead.reviews,
    website: lead.website,
    websiteStatus: lead.websiteStatus,
    phone: lead.phone,
    email: lead.email,
    leadScore: lead.leadScore,
    priority: lead.priority,
    weakDigitalPresence: lead.weakDigitalPresence,
  };
}

export function getSessionLeadsFromSearch(
  userId: string,
  searchId: string
): ScoredLead[] | null {
  const search = getServerSearch(searchId, userId);
  return search?.leads ?? null;
}
