/**
 * In-app MCP tool registry.
 * Tools wrap existing lib/ functions for the Groq agent loop.
 * Can be exposed as a standalone MCP server in a future release.
 */
export { MCP_TOOLS, executeTool, type ToolContext, type ToolEvent } from "./tools";

export const MCP_TOOL_NAMES = [
  "get_usage_stats",
  "search_leads",
  "search_leads_bulk",
  "filter_leads",
  "explain_lead_score",
  "draft_outreach_message",
] as const;
