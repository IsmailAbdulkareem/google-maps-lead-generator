import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { draftOutreachMessage } from "@/lib/groq/outreach";
import { explainLeadScore } from "@/lib/groq/score-explain";
import { isGroqConfigured } from "@/lib/groq/client";
import { hasProAiFeature, isUnlimited } from "@/lib/plans";
import {
  checkLimits,
  recordAiMessage,
} from "@/lib/usage-limits";
import type { ScoredLead } from "@/lib/types";

const outreachSchema = z.object({
  lead: z.record(z.string(), z.unknown()),
  userService: z.string().min(1),
  channel: z.enum(["email", "sms", "linkedin"]).default("email"),
  tone: z.enum(["professional", "friendly", "direct"]).optional(),
  language: z.string().optional(),
});

const explainSchema = z.object({
  lead: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGroqConfigured()) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const limits = await checkLimits();
    if (
      !isUnlimited(limits.maxAiMessages) &&
      limits.aiMessagesRemaining <= 0
    ) {
      return NextResponse.json(
        { error: "AI message limit reached." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const action = body.action as string;

    if (action === "explain") {
      if (!hasProAiFeature(limits.tier, "Score explanations")) {
        return NextResponse.json(
          { error: "Score explanations require Pro plan." },
          { status: 403 }
        );
      }
      const parsed = explainSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }
      await recordAiMessage(userId);
      const result = await explainLeadScore(
        parsed.data.lead as unknown as ScoredLead
      );
      return NextResponse.json(result);
    }

    if (action === "draft") {
      if (!hasProAiFeature(limits.tier, "Personalized outreach drafts")) {
        return NextResponse.json(
          { error: "Personalized outreach requires Pro plan." },
          { status: 403 }
        );
      }
      const parsed = outreachSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }
      await recordAiMessage(userId);
      const result = await draftOutreachMessage({
        lead: parsed.data.lead as unknown as ScoredLead,
        userService: parsed.data.userService,
        channel: parsed.data.channel,
        tone: parsed.data.tone,
        language: parsed.data.language,
        includeSubject: parsed.data.channel === "email",
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
