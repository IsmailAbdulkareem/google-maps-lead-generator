"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriorityBadge } from "@/components/PriorityBadge";
import { ChatMessageContent } from "@/components/ChatMessage";
import {
  createSearchId,
  saveSearch,
  getSearch,
} from "@/lib/local-storage";
import {
  loadChatSession,
  saveChatSession,
  clearChatSession,
} from "@/lib/chat-storage";
import { notifyUsageUpdated } from "@/lib/usage-events";
import type { LeadPriority, ScoredLead } from "@/lib/types";
import {
  Bot,
  Loader2,
  Send,
  ExternalLink,
  Search,
  Sparkles,
  Filter,
  Mail,
  Trash2,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ToolStatus {
  name: string;
  status: "running" | "done" | "error";
}

const WELCOME_MESSAGE = `Hi! I'm **LeadGen AI** — I help you find and qualify local business leads from Google Maps.

**What I can do**
• Search businesses in any city, area, or industry
• Score each lead from 0–100 based on online presence and reviews
• Filter to high-quality leads (e.g. score 85–100)
• Explain why a lead scored high and suggest a pitch angle
• Draft personalized outreach emails, SMS, or LinkedIn messages

Tell me what you're looking for — for example: "Find dentist leads in Karachi with score 85 to 100."`;

const SUGGESTIONS = [
  "Find dentist leads in Karachi with score 85 to 100",
  "Search for gyms in Lahore without websites",
  "What can you do?",
];

export function ChatPanel() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [streaming, setStreaming] = useState(false);
  const [toolStatuses, setToolStatuses] = useState<ToolStatus[]>([]);
  const [sessionLeads, setSessionLeads] = useState<ScoredLead[]>([]);
  const [sessionSearchId, setSessionSearchId] = useState<string | null>(null);
  const [savedSearchId, setSavedSearchId] = useState<string | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore chat session from localStorage
  useEffect(() => {
    if (!isLoaded || !userId) return;
    const session = loadChatSession(userId);
    if (session) {
      if (session.messages.length > 0) {
        setMessages(session.messages);
      }
      setSessionLeads(session.sessionLeads);
      setSessionSearchId(session.sessionSearchId);
      setSavedSearchId(session.savedSearchId);
      setPendingJobId(session.pendingJobId);
    }
    setHydrated(true);
  }, [isLoaded, userId]);

  // Persist chat session on every change
  useEffect(() => {
    if (!userId || !hydrated) return;
    saveChatSession(userId, {
      messages,
      sessionLeads,
      sessionSearchId,
      savedSearchId,
      pendingJobId,
      updatedAt: new Date().toISOString(),
    });
  }, [
    userId,
    hydrated,
    messages,
    sessionLeads,
    sessionSearchId,
    savedSearchId,
    pendingJobId,
  ]);

  function handleClearChat() {
    if (!userId) return;
    if (!confirm("Clear this chat and start fresh? Your saved leads table will stay on the device.")) return;
    clearChatSession(userId);
    setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
    setSessionLeads([]);
    setSessionSearchId(null);
    setSavedSearchId(null);
    setPendingJobId(null);
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, toolStatuses, sessionLeads, scrollToBottom]);

  useEffect(() => {
    if (!pendingJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${pendingJobId}`);
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          setPendingJobId(null);
          if (data.leads?.length) {
            handleLeadsFound(data.searchId, data.leads, "Bulk search");
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `**Results**\n\n• ${data.leadCount} qualified leads found\n• Score range: ${data.minScore}–${data.maxScore}\n• Ready to view or draft outreach\n\nWould you like to open the full table or draft a message for a specific lead?`,
              },
            ]);
          }
        } else if (data.status === "failed") {
          clearInterval(interval);
          setPendingJobId(null);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `The bulk search couldn't complete.\n\n• Reason: ${data.error ?? "Unknown error"}\n\nTry a smaller target or a different city.`,
            },
          ]);
        }
      } catch {
        // keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pendingJobId]);

  function handleLeadsFound(
    searchId: string,
    leads: ScoredLead[],
    query: string
  ) {
    setSessionLeads(leads);
    setSessionSearchId(searchId);

    const category = leads[0]?.category ?? "search";
    const city = leads[0]?.city ?? "";

    setSavedSearchId((current) => {
      if (current && getSearch(current)) {
        const existing = getSearch(current)!;
        saveSearch({
          ...existing,
          query,
          leads,
          leadCount: leads.length,
        });
        return current;
      }

      const id = createSearchId();
      saveSearch({
        id,
        query,
        category,
        city,
        createdAt: new Date().toISOString(),
        leadCount: leads.length,
        params: { category, city },
        leads,
      });
      return id;
    });
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const apiMessages = messages.filter(
      (m) => !(m.role === "assistant" && m.content === WELCOME_MESSAGE)
    );
    const userMessage: ChatMessage = { role: "user", content: text.trim() };
    const nextMessages = [...apiMessages, userMessage];

    setMessages([...messages, userMessage]);
    setInput("");
    setStreaming(true);
    setToolStatuses([]);

    const assistantIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          sessionLeads,
          sessionSearchId,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Chat failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6)) as {
            type: string;
            content?: string;
            name?: string;
            searchId?: string;
            leads?: ScoredLead[];
            query?: string;
            jobId?: string;
            message?: string;
            sessionSearchId?: string | null;
            sessionLeads?: ScoredLead[];
          };

          if (event.type === "text" && event.content) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[assistantIndex] = {
                role: "assistant",
                content:
                  (updated[assistantIndex]?.content ?? "") + event.content,
              };
              return updated;
            });
          }

          if (event.type === "tool_start" && event.name) {
            setToolStatuses((prev) => [
              ...prev.filter((t) => t.name !== event.name),
              { name: formatToolName(event.name!), status: "running" },
            ]);
          }

          if (event.type === "tool_result" && event.name) {
            setToolStatuses((prev) =>
              prev.map((t) =>
                t.name === formatToolName(event.name!)
                  ? { ...t, status: "done" }
                  : t
              )
            );
          }

          if (event.type === "leads" && event.searchId && event.leads) {
            handleLeadsFound(
              event.searchId,
              event.leads,
              event.query ?? "AI search"
            );
          }

          if (event.type === "job_started" && event.jobId) {
            setPendingJobId(event.jobId);
          }

          if (event.type === "error" && event.message) {
            setToolStatuses((prev) => [
              ...prev,
              { name: event.message!, status: "error" },
            ]);
          }

          if (event.type === "done") {
            if (event.sessionLeads) setSessionLeads(event.sessionLeads);
            if (event.sessionSearchId !== undefined)
              setSessionSearchId(event.sessionSearchId);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Chat failed";
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIndex] = {
          role: "assistant",
          content: `Something went wrong.\n\n• ${msg}\n\nPlease try again or use **Manual Search** if the issue persists.`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      setToolStatuses([]);
      notifyUsageUpdated();
    }
  }

  function openInTable() {
    if (savedSearchId && getSearch(savedSearchId)) {
      router.push(`/leads/${savedSearchId}`);
      return;
    }

    const id = createSearchId();
    saveSearch({
      id,
      query: "AI search",
      category: sessionLeads[0]?.category ?? "",
      city: sessionLeads[0]?.city ?? "",
      createdAt: new Date().toISOString(),
      leadCount: sessionLeads.length,
      params: {
        category: sessionLeads[0]?.category ?? "",
        city: sessionLeads[0]?.city ?? "",
      },
      leads: sessionLeads,
    });
    setSavedSearchId(id);
    router.push(`/leads/${id}`);
  }

  if (!isLoaded) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-20">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-foreground/60">
          <Bot className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">
            AI Assistant
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          LeadGen AI
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Describe the leads you want in plain English — I&apos;ll search, score,
          and help you reach out. Your conversation is saved on this device.
        </p>
        {messages.length > 1 && (
          <button
            type="button"
            onClick={handleClearChat}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-foreground/50 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear chat
          </button>
        )}
      </div>

      <div className="flex min-h-[min(640px,70vh)] flex-1 flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02]">
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-5 ${msg.role === "user" ? "flex justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium text-foreground/50">
                    LeadGen AI
                  </span>
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-foreground text-background"
                    : "border border-foreground/10 bg-background"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm">{msg.content}</p>
                ) : msg.content ? (
                  <ChatMessageContent content={msg.content} />
                ) : streaming && i === messages.length - 1 ? (
                  <Loader2 className="h-4 w-4 animate-spin text-foreground/40" />
                ) : null}
              </div>
            </div>
          ))}

          {toolStatuses.length > 0 && (
            <div className="mb-4 space-y-2 rounded-xl border border-foreground/10 bg-background px-4 py-3">
              {toolStatuses.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-foreground/60"
                >
                  {t.status === "running" && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  <span>{t.name}</span>
                </div>
              ))}
            </div>
          )}

          {sessionLeads.length > 0 && !streaming && (
            <div className="mb-4 rounded-xl border border-foreground/10 bg-background p-4">
              <p className="mb-3 text-sm font-medium">
                {sessionLeads.length} leads in this session
              </p>
              <div className="space-y-2">
                {sessionLeads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.placeId}
                    className="flex items-center justify-between rounded-lg border border-foreground/5 px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-medium">{lead.businessName}</span>
                      <span className="ml-2 text-foreground/50">
                        Score {lead.leadScore}
                      </span>
                    </div>
                    <PriorityBadge
                      priority={lead.priority as LeadPriority}
                    />
                  </div>
                ))}
              </div>
              {sessionLeads.length > 5 && (
                <p className="mt-2 text-xs text-foreground/40">
                  +{sessionLeads.length - 5} more leads
                </p>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3 w-full gap-1"
                onClick={openInTable}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open full table
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && !streaming && (
          <div className="border-t border-foreground/10 px-4 py-3 sm:px-6">
            <p className="mb-2 text-xs font-medium text-foreground/50">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-foreground/15 px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          className="border-t border-foreground/10 p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Find dentist leads in Karachi with score 85–100"
              disabled={streaming}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={streaming || !input.trim()}
              className="gap-1"
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
          {pendingJobId && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground/50">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running bulk search — this may take a minute…
            </p>
          )}
          <p className="mt-2 text-xs text-foreground/40">
            Prefer forms?{" "}
            <Link href="/search" className="underline hover:text-foreground/60">
              Use manual search
            </Link>
          </p>
        </form>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          { icon: Search, label: "Search", desc: "Google Maps lookup" },
          { icon: Sparkles, label: "Score", desc: "0–100 lead rating" },
          { icon: Filter, label: "Filter", desc: "High-quality only" },
          { icon: Mail, label: "Outreach", desc: "Draft messages" },
        ].map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-foreground/10 p-3"
          >
            <Icon className="h-4 w-4 shrink-0 text-foreground/40" />
            <div>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-xs text-foreground/50">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatToolName(name: string): string {
  const labels: Record<string, string> = {
    get_usage_stats: "Checking your plan limits",
    search_leads: "Searching Google Maps",
    search_leads_bulk: "Running bulk search",
    filter_leads: "Filtering leads by score",
    explain_lead_score: "Analyzing lead score",
    draft_outreach_message: "Writing outreach message",
  };
  return labels[name] ?? name;
}
