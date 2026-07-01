import { calculateLeadScore } from "../lead-scorer";
import { getGroqClient, getGroqModel } from "./client";
import type { ScoredLead, ScoreExplanation } from "../types";

export function buildScoreBreakdown(lead: ScoredLead): {
  criterion: string;
  points: number;
}[] {
  const hasWebsite = Boolean(lead.website?.trim());
  const breakdown: { criterion: string; points: number }[] = [];

  if (!hasWebsite) breakdown.push({ criterion: "No website", points: 50 });
  if (lead.rating !== null && lead.rating > 4.0)
    breakdown.push({ criterion: "Rating above 4.0", points: 20 });
  if (lead.reviews !== null && lead.reviews > 100)
    breakdown.push({ criterion: "More than 100 reviews", points: 15 });
  if (lead.phone) breakdown.push({ criterion: "Phone available", points: 10 });
  if (lead.businessStatus === "OPERATIONAL")
    breakdown.push({ criterion: "Business operational", points: 5 });

  return breakdown;
}

export async function explainLeadScore(
  lead: ScoredLead
): Promise<ScoreExplanation> {
  const breakdown = buildScoreBreakdown(lead);
  const expectedScore = calculateLeadScore({
    hasWebsite: Boolean(lead.website?.trim()),
    rating: lead.rating,
    reviews: lead.reviews,
    phone: lead.phone,
    businessStatus: lead.businessStatus,
  });

  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: getGroqModel(),
    messages: [
      {
        role: "system",
        content:
          "You explain lead scores for a local business lead generator. Be concise and actionable. Return JSON only.",
      },
      {
        role: "user",
        content: `Explain this lead score and suggest a pitch angle.

Business: ${lead.businessName}
Category: ${lead.category}
City: ${lead.city}
Score: ${lead.leadScore} (expected: ${expectedScore})
Rating: ${lead.rating ?? "N/A"}
Reviews: ${lead.reviews ?? "N/A"}
Website: ${lead.website ?? "none"} (${lead.websiteStatus})
Phone: ${lead.phone ?? "N/A"}
Weak digital presence: ${lead.weakDigitalPresence}

Score breakdown: ${JSON.stringify(breakdown)}

Return JSON: {"rationale": "2-3 sentences", "pitchAngle": "1 sentence sales angle"}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  let parsed: { rationale?: string; pitchAngle?: string } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {
      rationale: `Score of ${lead.leadScore} based on online presence signals.`,
      pitchAngle: lead.weakDigitalPresence
        ? "Pitch website or digital marketing — strong reviews but weak online presence."
        : "Highlight how your service can grow their business.",
    };
  }

  return {
    score: lead.leadScore,
    breakdown,
    rationale:
      parsed.rationale ??
      `This lead scored ${lead.leadScore} based on website presence, reviews, and contact info.`,
    pitchAngle:
      parsed.pitchAngle ??
      "Focus on the gap between their offline reputation and digital presence.",
  };
}
