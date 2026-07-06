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

  const existing = findSearchByParams(search.params);
  const id = existing ? existing.id : search.id;
  const merged = { ...search, id };

  localStorage.setItem(searchKey(id), JSON.stringify(merged));

  const index = getIndexIds();
  const next = [id, ...index.filter((i) => i !== id)].slice(0, MAX_SAVED);
  localStorage.setItem(INDEX_KEY, JSON.stringify(next));

  for (const i of index) {
    if (!next.includes(i)) localStorage.removeItem(searchKey(i));
  }
}

export function findSearchByParams(params: SearchParams): SavedSearch | null {
  if (!isBrowser()) return null;
  for (const id of getIndexIds()) {
    const s = getSearch(id);
    if (!s) continue;
    if (
      s.params.category.toLowerCase() === params.category.toLowerCase() &&
      s.params.city.toLowerCase() === params.city.toLowerCase() &&
      (s.params.area ?? "").toLowerCase() === (params.area ?? "").toLowerCase() &&
      (s.params.country ?? "").toLowerCase() === (params.country ?? "").toLowerCase()
    ) {
      return s;
    }
  }
  return null;
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

export function updateSearchLeads(id: string, leads: ScoredLead[]): boolean {
  const search = getSearch(id);
  if (!search) return false;
  saveSearch({
    ...search,
    leads,
    leadCount: leads.length,
  });
  return true;
}
