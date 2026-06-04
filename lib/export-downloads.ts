import { formatWebsiteDisplay } from "./website-analyzer";
import { leadToExport } from "./run-search";
import type { ScoredLead, WebsiteStatus } from "./types";
import type { LeadFilter } from "./lead-filters";
import { filterLeads } from "./lead-filters";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getExportRows(leads: ScoredLead[], filter: LeadFilter) {
  return filterLeads(leads, filter).map((lead) => ({
    ...leadToExport(lead),
    website_display: formatWebsiteDisplay(
      lead.website,
      lead.websiteStatus as WebsiteStatus
    ),
  }));
}

export function downloadJson(
  leads: ScoredLead[],
  filter: LeadFilter,
  filename: string
) {
  const data = getExportRows(leads, filter);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, filename);
}

export function downloadCsv(
  leads: ScoredLead[],
  filter: LeadFilter,
  filename: string
) {
  const rows = getExportRows(leads, filter);
  const headers = [
    "business_name",
    "category",
    "address",
    "city",
    "rating",
    "reviews",
    "website",
    "phone",
    "email",
    "lead_score",
    "priority",
  ];

  const escape = (v: string | number | null) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.business_name,
        r.category,
        r.address,
        r.city,
        r.rating,
        r.reviews,
        r.website,
        r.phone,
        r.email,
        r.lead_score,
        r.priority,
      ]
        .map(escape)
        .join(",")
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}

export async function downloadPdf(
  leads: ScoredLead[],
  filter: LeadFilter,
  filename: string,
  title: string
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const rows = getExportRows(leads, filter);
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString()} · ${rows.length} leads`, 14, 24);

  autoTable(doc, {
    startY: 28,
    head: [
      [
        "Business",
        "Category",
        "Address",
        "Rating",
        "Reviews",
        "Website",
        "Phone",
        "Email",
        "Score",
        "Priority",
      ],
    ],
    body: rows.map((r) => [
      r.business_name,
      r.category,
      r.address,
      r.rating ?? "",
      r.reviews ?? "",
      r.website_display,
      r.phone ?? "",
      r.email ?? "",
      String(r.lead_score),
      r.priority,
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [23, 23, 23] },
  });

  doc.save(filename);
}

export async function downloadDocx(
  leads: ScoredLead[],
  filter: LeadFilter,
  filename: string,
  title: string
) {
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    HeadingLevel,
    WidthType,
  } = await import("docx");

  const rows = getExportRows(leads, filter);

  const headerCells = [
    "Business",
    "Category",
    "Address",
    "Rating",
    "Reviews",
    "Website",
    "Phone",
    "Email",
    "Score",
    "Priority",
  ].map(
    (text) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
        width: { size: 11, type: WidthType.PERCENTAGE },
      })
  );

  const dataRows = rows.map(
    (r) =>
      new TableRow({
        children: [
          r.business_name,
          r.category,
          r.address,
          r.rating != null ? String(r.rating) : "N/A",
          r.reviews != null ? String(r.reviews) : "N/A",
          r.website_display,
          r.phone ?? "N/A",
          r.email ?? "N/A",
          String(r.lead_score),
          r.priority,
        ].map(
          (text) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text })] })],
            })
        ),
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated ${new Date().toLocaleString()} — ${rows.length} leads`,
                size: 20,
              }),
            ],
          }),
          new Table({
            rows: [new TableRow({ children: headerCells }), ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}
