import type { ScoredLead, SearchParams } from "./types";

export interface SavedSearchMeta {
  id: string;
  query: string;
  category: string;
  city: string;
  area?: string;
  country?: string;
  createdAt: string;
  leadCount: number;
}

export interface SavedSearch extends SavedSearchMeta {
  params: SearchParams;
  leads: ScoredLead[];
}

const INDEX_KEY = "lead-generator-index";
const searchKey = (id: string) => `lead-search-${id}`;
const MAX_SAVED = 50;

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function saveSearch(search: SavedSearch): void {
  if (!isBrowser()) return;
  localStorage.setItem(searchKey(search.id), JSON.stringify(search));

  const index = getIndexIds();
  const next = [search.id, ...index.filter((id) => id !== search.id)].slice(
    0,
    MAX_SAVED
  );
  localStorage.setItem(INDEX_KEY, JSON.stringify(next));

  for (const id of index) {
    if (!next.includes(id)) localStorage.removeItem(searchKey(id));
  }
}

export function getSearch(id: string): SavedSearch | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(searchKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedSearch;
  } catch {
    return null;
  }
}

export function deleteSearch(id: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(searchKey(id));
  const next = getIndexIds().filter((i) => i !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(next));
}

function getIndexIds(): string[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function listSavedSearches(): SavedSearchMeta[] {
  if (!isBrowser()) return [];
  const results: SavedSearchMeta[] = [];
  for (const id of getIndexIds()) {
    const s = getSearch(id);
    if (!s) continue;
    results.push({
      id: s.id,
      query: s.query,
      category: s.category,
      city: s.city,
      area: s.area,
      country: s.country,
      createdAt: s.createdAt,
      leadCount: s.leads.length,
    });
  }
  return results;
}

export function createSearchId(): string {
  return crypto.randomUUID();
}
