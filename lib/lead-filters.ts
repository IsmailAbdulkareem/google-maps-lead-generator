import type { LeadPriority, ScoredLead, WebsiteStatus } from "./types";

export type LeadFilter =
  | "all"
  | "no_website"
  | "high_priority"
  | "missing_website_report";

export function filterLeads(
  leads: ScoredLead[],
  filter: LeadFilter
): ScoredLead[] {
  switch (filter) {
    case "no_website":
    case "missing_website_report":
      return leads.filter(
        (l) => !l.website?.trim() || l.websiteStatus === "none"
      );
    case "high_priority":
      return leads.filter((l) => l.priority === "high");
    default:
      return leads;
  }
}

export interface ScoreFilterOptions {
  minScore?: number;
  maxScore?: number;
  priority?: LeadPriority;
  websiteStatus?: WebsiteStatus[];
  weakDigitalPresenceOnly?: boolean;
  limit?: number;
}

export function filterLeadsByScore(
  leads: ScoredLead[],
  options: ScoreFilterOptions
): ScoredLead[] {
  let result = [...leads];

  if (options.minScore !== undefined) {
    result = result.filter((l) => l.leadScore >= options.minScore!);
  }
  if (options.maxScore !== undefined) {
    result = result.filter((l) => l.leadScore <= options.maxScore!);
  }
  if (options.priority) {
    result = result.filter((l) => l.priority === options.priority);
  }
  if (options.websiteStatus?.length) {
    const statuses = new Set(options.websiteStatus);
    result = result.filter((l) => statuses.has(l.websiteStatus));
  }
  if (options.weakDigitalPresenceOnly) {
    result = result.filter((l) => l.weakDigitalPresence);
  }

  result.sort((a, b) => b.leadScore - a.leadScore);

  if (options.limit !== undefined && options.limit > 0) {
    result = result.slice(0, options.limit);
  }

  return result;
}
