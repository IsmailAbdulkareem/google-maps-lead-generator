import { getGroqClient, getGroqModel } from "./client";
import type { OutreachRequest, OutreachResult, ScoredLead } from "../types";

function buildLeadContext(lead: ScoredLead): string {
  return [
    `Business: ${lead.businessName}`,
    `Category: ${lead.category}`,
    `City: ${lead.city}`,
    `Address: ${lead.address}`,
    `Rating: ${lead.rating ?? "N/A"} (${lead.reviews ?? 0} reviews)`,
    `Website: ${lead.website ?? "none"} (${lead.websiteStatus})`,
    `Phone: ${lead.phone ?? "N/A"}`,
    `Email: ${lead.email ?? "N/A"}`,
    `Lead score: ${lead.leadScore}`,
    `Weak digital presence: ${lead.weakDigitalPresence}`,
  ].join("\n");
}

export async function draftOutreachMessage(
  request: OutreachRequest
): Promise<OutreachResult> {
  const { lead, userService, channel, tone = "professional", language = "en" } =
    request;

  const hooks: string[] = [];
  if (lead.rating && lead.rating > 4) hooks.push(`${lead.rating}★ rating`);
  if (lead.reviews && lead.reviews > 50)
    hooks.push(`${lead.reviews} reviews`);
  if (!lead.website || lead.websiteStatus === "none")
    hooks.push("no website detected");
  if (lead.weakDigitalPresence)
    hooks.push("strong reviews but weak digital presence");

  const groq = getGroqClient();
  const userPhone = process.env.USER_PHONE || null;
  const response = await groq.chat.completions.create({
    model: getGroqModel(),
    messages: [
      {
        role: "system",
        content: `You write personalized outreach messages for local business leads.
Rules:
- Reference at least 2 real details from the lead data
- One clear ask, no feature dumping
- Tone: ${tone}
- Language: ${language}
- Channel: ${channel}
- Do NOT use placeholder brackets like [Name] — use the actual business name
- NEVER invent a phone number. Only include a phone number if one is provided below.
${userPhone ? `- If appropriate for this channel, include this contact phone: ${userPhone}` : "- Do NOT include any phone number in the message."}
- Return JSON only`,
      },
      {
        role: "user",
        content: `Write a ${channel} outreach message.

Service I'm selling: ${userService}

Lead data:
${buildLeadContext(lead)}

Return JSON: ${
          channel === "email"
            ? '{"subject": "...", "body": "...", "personalizationHooks": ["...", "..."]}'
            : '{"body": "...", "personalizationHooks": ["...", "..."]}'
        }`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  let parsed: {
    subject?: string;
    body?: string;
    personalizationHooks?: string[];
  } = {};

  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {
      body: `Hi ${lead.businessName} team,\n\nI noticed your ${lead.rating ? `${lead.rating}★` : "strong"} reputation in ${lead.city}. I help businesses like yours with ${userService}. Would you be open to a quick chat?\n\nBest regards`,
      personalizationHooks: hooks.slice(0, 2),
    };
  }

  return {
    subject: request.includeSubject !== false ? parsed.subject : undefined,
    body:
      parsed.body ??
      `Hi ${lead.businessName},\n\nI'd love to discuss how ${userService} could help your business in ${lead.city}.`,
    personalizationHooks: parsed.personalizationHooks ?? hooks.slice(0, 2),
  };
}
