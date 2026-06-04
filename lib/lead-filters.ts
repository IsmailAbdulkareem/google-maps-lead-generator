import type { ScoredLead } from "./types";

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
      return leads.filter((l) => !l.website?.trim() || l.websiteStatus === "none");
    case "high_priority":
      return leads.filter((l) => l.priority === "high");
    default:
      return leads;
  }
}
