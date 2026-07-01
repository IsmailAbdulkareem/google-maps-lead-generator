import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "groq-sdk/resources/chat/completions";
import { getGroqClient, getGroqModel } from "../groq/client";
import { buildSystemPrompt } from "../groq/system-prompt";
import {
  MCP_TOOLS,
  executeTool,
  type ToolContext,
  type ToolEvent,
} from "../mcp/tools";
import type { ChatMessage, ScoredLead } from "../types";
import type { FullUsageStats } from "../usage-limits";

export interface AgentStreamEvent {
  type:
    | "text"
    | "tool_start"
    | "tool_result"
    | "leads"
    | "job_started"
    | "error"
    | "done";
  content?: string;
  name?: string;
  args?: unknown;
  result?: unknown;
  searchId?: string;
  leads?: ScoredLead[];
  query?: string;
  jobId?: string;
  message?: string;
  sessionSearchId?: string | null;
  sessionLeads?: ScoredLead[];
}

const MAX_TOOL_ROUNDS = 8;

function toGroqMessages(
  systemPrompt: string,
  messages: ChatMessage[]
): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: systemPrompt },
    ...messages.map(
      (m) =>
        ({
          role: m.role,
          content: m.content,
        }) as ChatCompletionMessageParam
    ),
  ];
}

export async function* runAgent(
  messages: ChatMessage[],
  limits: FullUsageStats,
  userId: string,
  initialLeads: ScoredLead[] = [],
  initialSearchId: string | null = null
): AsyncGenerator<AgentStreamEvent> {
  const groq = getGroqClient();
  const systemPrompt = buildSystemPrompt(limits);

  const ctx: ToolContext = {
    userId,
    sessionLeads: initialLeads,
    sessionSearchId: initialSearchId,
    limits,
  };

  const conversationMessages: ChatCompletionMessageParam[] = toGroqMessages(
    systemPrompt,
    messages
  );

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = await groq.chat.completions.create({
      model: getGroqModel(),
      messages: conversationMessages,
      tools: MCP_TOOLS,
      tool_choice: "auto",
      stream: true,
      temperature: 0.4,
      max_tokens: 2048,
    });

    let assistantContent = "";
    const toolCalls: Map<
      number,
      { id: string; name: string; arguments: string }
    > = new Map();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        assistantContent += delta.content;
        yield { type: "text", content: delta.content };
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCalls.has(idx)) {
            toolCalls.set(idx, {
              id: tc.id ?? `call_${idx}`,
              name: tc.function?.name ?? "",
              arguments: tc.function?.arguments ?? "",
            });
          } else {
            const existing = toolCalls.get(idx)!;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments)
              existing.arguments += tc.function.arguments;
            if (tc.id) existing.id = tc.id;
          }
        }
      }
    }

    const calls = [...toolCalls.values()].filter((c) => c.name);

    if (calls.length === 0) {
      yield {
        type: "done",
        sessionSearchId: ctx.sessionSearchId,
        sessionLeads: ctx.sessionLeads,
      };
      return;
    }

    conversationMessages.push({
      role: "assistant",
      content: assistantContent || null,
      tool_calls: calls.map((c) => ({
        id: c.id,
        type: "function" as const,
        function: { name: c.name, arguments: c.arguments },
      })),
    });

    for (const call of calls) {
      let args: unknown = {};
      try {
        args = JSON.parse(call.arguments || "{}");
      } catch {
        args = {};
      }

      yield { type: "tool_start", name: call.name, args };

      const toolEvents: ToolEvent[] = [];
      let result: unknown;

      try {
        result = await executeTool(
          call.name,
          args,
          ctx,
          (e) => toolEvents.push(e)
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Tool execution failed";
        yield { type: "error", message };

        const toolMessage: ChatCompletionToolMessageParam = {
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ error: message }),
        };
        conversationMessages.push(toolMessage);
        continue;
      }

      for (const event of toolEvents) {
        if (event.type === "leads") {
          yield {
            type: "leads",
            searchId: event.searchId,
            leads: event.leads,
            query: event.query,
          };
        } else if (event.type === "job_started") {
          yield { type: "job_started", jobId: event.jobId };
        } else if (event.type === "error") {
          yield { type: "error", message: event.message };
        }
      }

      yield { type: "tool_result", name: call.name, result };

      const toolMessage: ChatCompletionToolMessageParam = {
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      };
      conversationMessages.push(toolMessage);
    }
  }

  yield {
    type: "done",
    sessionSearchId: ctx.sessionSearchId,
    sessionLeads: ctx.sessionLeads,
  };
}
