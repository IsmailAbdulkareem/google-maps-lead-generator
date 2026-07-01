import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgent } from "@/lib/groq/agent";
import { isGroqConfigured } from "@/lib/groq/client";
import {
  checkLimits,
  recordAiMessage,
} from "@/lib/usage-limits";
import { isUnlimited } from "@/lib/plans";
import type { ChatMessage, ScoredLead } from "@/lib/types";

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    })
  ),
  sessionLeads: z.array(z.unknown()).optional(),
  sessionSearchId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGroqConfigured()) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 503 }
      );
    }

    const limits = await checkLimits();
    if (
      !isUnlimited(limits.maxAiMessages) &&
      limits.aiMessagesRemaining <= 0
    ) {
      return NextResponse.json(
        {
          error: "AI message limit reached. Upgrade to Pro for more.",
          limitType: "aiMessages",
          usage: limits,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const messages: ChatMessage[] = parsed.data.messages;
    const sessionLeads = (parsed.data.sessionLeads ?? []) as ScoredLead[];
    const sessionSearchId = parsed.data.sessionSearchId ?? null;

    await recordAiMessage(userId);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(event: Record<string, unknown>) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }

        try {
          for await (const event of runAgent(
            messages,
            limits,
            userId,
            sessionLeads,
            sessionSearchId
          )) {
            send(event as unknown as Record<string, unknown>);
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Chat failed";
          send({ type: "error", message });
          send({ type: "done" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
