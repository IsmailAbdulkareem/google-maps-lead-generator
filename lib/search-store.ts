import type { ScoredLead, SearchParams, ServerSavedSearch } from "./types";

const store = new Map<string, ServerSavedSearch>();
const TTL_MS = 24 * 60 * 60 * 1000;

function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, search] of store) {
    if (now - new Date(search.createdAt).getTime() > TTL_MS) {
      store.delete(id);
    }
  }
}

export function saveServerSearch(search: ServerSavedSearch): void {
  cleanupExpired();
  store.set(search.id, search);
}

export function getServerSearch(
  id: string,
  userId: string
): ServerSavedSearch | null {
  cleanupExpired();
  const search = store.get(id);
  if (!search || search.userId !== userId) return null;
  return search;
}

export function listServerSearches(userId: string): ServerSavedSearch[] {
  cleanupExpired();
  return [...store.values()]
    .filter((s) => s.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function createServerSearchId(): string {
  return crypto.randomUUID();
}

export function updateServerSearchLeads(
  id: string,
  userId: string,
  leads: ScoredLead[]
): boolean {
  const search = getServerSearch(id, userId);
  if (!search) return false;
  search.leads = leads;
  store.set(id, search);
  return true;
}

export function buildServerSearch(
  userId: string,
  params: SearchParams,
  query: string,
  leads: ScoredLead[]
): ServerSavedSearch {
  return {
    id: createServerSearchId(),
    userId,
    query,
    params,
    leads,
    createdAt: new Date().toISOString(),
  };
}
