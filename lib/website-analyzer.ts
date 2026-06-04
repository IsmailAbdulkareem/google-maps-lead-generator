import { getEnvInt } from "./utils";
import type { WebsiteStatus } from "./types";

const PARKED_KEYWORDS = [
  "domain for sale",
  "buy this domain",
  "parked free",
  "coming soon",
  "under construction",
];

const BLOCKED_EMAIL_DOMAINS = new Set([
  "example.com",
  "email.com",
  "domain.com",
  "wix.com",
  "sentry.io",
  "google.com",
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "schema.org",
  "w3.org",
  "wordpress.org",
  "gravatar.com",
  "cloudflare.com",
  "gstatic.com",
  "googleapis.com",
]);

export interface WebsiteAnalysis {
  status: WebsiteStatus;
  email: string | null;
}

export async function analyzeWebsite(
  websiteUrl: string | null
): Promise<WebsiteAnalysis> {
  if (!websiteUrl?.trim()) {
    return { status: "none", email: null };
  }

  const timeoutMs = getEnvInt("WEBSITE_CHECK_TIMEOUT_MS", 5000);
  const url = normalizeUrl(websiteUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "LeadGeneratorBot/1.0" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { status: "unreachable", email: null };
    }

    const html = (await response.text()).slice(0, 80000);
    const email = extractEmailFromHtml(html);
    if (isLikelyOutdated(html, url)) {
      return { status: "likely_outdated", email };
    }
    return { status: "ok", email };
  } catch {
    return { status: "unreachable", email: null };
  }
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function isLikelyOutdated(html: string, url: string): boolean {
  const lower = html.toLowerCase();
  const currentYear = new Date().getFullYear();

  if (PARKED_KEYWORDS.some((k) => lower.includes(k))) return true;
  if (!url.startsWith("https://")) return true;
  if (!lower.includes("viewport")) return true;

  const copyrightMatch = lower.match(/(?:©|copyright)\s*(?:©\s*)?(\d{4})/i);
  if (copyrightMatch) {
    const year = parseInt(copyrightMatch[1], 10);
    if (year < currentYear - 2) return true;
  }

  if (html.length < 500) return true;

  return false;
}

function isValidBusinessEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".webp")) {
    return false;
  }
  const domain = lower.split("@")[1];
  if (!domain || BLOCKED_EMAIL_DOMAINS.has(domain)) return false;
  if (domain.endsWith(".png") || domain.endsWith(".jpg")) return false;
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
}

export function extractEmailFromHtml(html: string): string | null {
  const mailtoPattern =
    /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  for (const match of html.matchAll(mailtoPattern)) {
    const email = decodeURIComponent(match[1]).trim();
    if (isValidBusinessEmail(email)) return email.toLowerCase();
  }

  const emailPattern =
    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
  for (const match of html.matchAll(emailPattern)) {
    const email = match[0].trim();
    if (isValidBusinessEmail(email)) return email.toLowerCase();
  }

  return null;
}

export function formatWebsiteDisplay(
  website: string | null,
  status: WebsiteStatus
): string {
  if (!website?.trim() || status === "none") return "No Website";
  if (status === "likely_outdated") return "Outdated";
  if (status === "unreachable") return "Unreachable";
  if (status === "ok") return "Yes";
  return "Not Available";
}

export function formatEmailDisplay(email: string | null): string {
  if (!email) return "Not Available";
  return email;
}
