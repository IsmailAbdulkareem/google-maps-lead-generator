"use client";

import { useMemo, useState } from "react";
import { PriorityBadge } from "@/components/PriorityBadge";
import { OutreachModal } from "@/components/OutreachModal";
import { Button } from "@/components/ui/button";
import { useUsageStats } from "@/components/UsageIndicator";
import { formatWebsiteDisplay } from "@/lib/website-analyzer";
import type { LeadFilter } from "@/lib/lead-filters";
import { filterLeads } from "@/lib/lead-filters";
import {
  downloadCsv,
  downloadDocx,
  downloadJson,
  downloadPdf,
} from "@/lib/export-downloads";
import type { LeadPriority, ScoredLead, WebsiteStatus } from "@/lib/types";
import { Download, ExternalLink, FileText, Sparkles } from "lucide-react";

export function LeadsTable({
  leads: allLeads,
  exportTitle,
  searchId,
}: {
  leads: ScoredLead[];
  exportTitle: string;
  searchId: string;
}) {
  const [filter, setFilter] = useState<LeadFilter>("all");
  const [exporting, setExporting] = useState<string | null>(null);
  const [outreachLead, setOutreachLead] = useState<ScoredLead | null>(null);
  const { stats } = useUsageStats();

  const leads = useMemo(
    () => filterLeads(allLeads, filter),
    [allLeads, filter]
  );

  const isMissingReport = filter === "missing_website_report";
  const baseName = `leads-${searchId.slice(0, 8)}`;

  async function handleExport(
    kind: "csv" | "json" | "pdf" | "docx"
  ) {
    setExporting(kind);
    try {
      if (kind === "csv") downloadCsv(allLeads, filter, `${baseName}.csv`);
      else if (kind === "json") downloadJson(allLeads, filter, `${baseName}.json`);
      else if (kind === "pdf")
        await downloadPdf(allLeads, filter, `${baseName}.pdf`, exportTitle);
      else if (kind === "docx")
        await downloadDocx(allLeads, filter, `${baseName}.docx`, exportTitle);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All leads"],
            ["no_website", "No website"],
            ["high_priority", "High priority"],
            ["missing_website_report", "Missing website report"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={!!exporting || leads.length === 0}
            onClick={() => handleExport("csv")}
          >
            <Download className="h-3.5 w-3.5" />
            {exporting === "csv" ? "…" : "CSV"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={!!exporting || leads.length === 0}
            onClick={() => handleExport("pdf")}
          >
            <FileText className="h-3.5 w-3.5" />
            {exporting === "pdf" ? "…" : "PDF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={!!exporting || leads.length === 0}
            onClick={() => handleExport("docx")}
          >
            <FileText className="h-3.5 w-3.5" />
            {exporting === "docx" ? "…" : "Word"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={!!exporting || leads.length === 0}
            onClick={() => handleExport("json")}
          >
            <Download className="h-3.5 w-3.5" />
            {exporting === "json" ? "…" : "JSON"}
          </Button>
        </div>
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-foreground/60">No leads match this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-foreground/10">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-foreground/10 bg-foreground/[0.03]">
              <tr>
                <th className="px-4 py-3 font-medium">Business Name</th>
                {!isMissingReport && (
                  <th className="px-4 py-3 font-medium">Category</th>
                )}
                <th className="px-4 py-3 font-medium">
                  {isMissingReport ? "Address" : "Rating"}
                </th>
                <th className="px-4 py-3 font-medium">Reviews</th>
                <th className="px-4 py-3 font-medium">Website</th>
                {!isMissingReport && (
                  <>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">AI</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.placeId}
                  className="border-b border-foreground/5 hover:bg-foreground/[0.02]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{lead.businessName}</div>
                    {lead.weakDigitalPresence && !isMissingReport && (
                      <span className="mt-1 inline-block text-xs text-amber-600 dark:text-amber-400">
                        High reviews, weak digital presence
                      </span>
                    )}
                    {lead.googleMapsLink && (
                      <a
                        href={lead.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-0.5 text-xs text-foreground/50 hover:text-foreground"
                      >
                        Maps <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </td>
                  {!isMissingReport && (
                    <td className="px-4 py-3 capitalize text-foreground/80">
                      {lead.category}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {isMissingReport
                      ? lead.address
                      : lead.rating ?? "Not Available"}
                  </td>
                  <td className="px-4 py-3">
                    {lead.reviews ?? "Not Available"}
                  </td>
                  <td className="px-4 py-3">
                    {isMissingReport &&
                    (!lead.website || lead.websiteStatus === "none") ? (
                      <span className="text-red-600 dark:text-red-400">
                        No Website
                      </span>
                    ) : (
                      formatWebsiteDisplay(
                        lead.website,
                        lead.websiteStatus as WebsiteStatus
                      )
                    )}
                  </td>
                  {!isMissingReport && (
                    <>
                      <td className="px-4 py-3">
                        {lead.phone ?? "Not Available"}
                      </td>
                      <td className="px-4 py-3">
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-foreground/80 hover:underline"
                          >
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-foreground/50" title="Google Maps does not provide emails; we scan the business website when available">
                            Not Available
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge
                          priority={lead.priority as LeadPriority}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        {lead.leadScore}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => setOutreachLead(lead)}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Outreach
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {outreachLead && (
        <OutreachModal
          lead={outreachLead}
          open={!!outreachLead}
          onClose={() => setOutreachLead(null)}
          tier={stats?.tier ?? "free"}
        />
      )}
    </div>
  );
}
