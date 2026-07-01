import type { ScoredLead } from "./types";

export interface StoredChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  messages: StoredChatMessage[];
  sessionLeads: ScoredLead[];
  sessionSearchId: string | null;
  savedSearchId: string | null;
  pendingJobId: string | null;
  updatedAt: string;
}

function chatKey(userId: string): string {
  return `leadgen-chat-${userId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadChatSession(userId: string): ChatSession | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(chatKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ChatSession;
  } catch {
    return null;
  }
}

export function saveChatSession(userId: string, session: ChatSession): void {
  if (!isBrowser()) return;
  localStorage.setItem(
    chatKey(userId),
    JSON.stringify({ ...session, updatedAt: new Date().toISOString() })
  );
}

export function clearChatSession(userId: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(chatKey(userId));
}
