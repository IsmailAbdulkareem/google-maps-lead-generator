"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScoredLead } from "@/lib/types";
import { Loader2, Copy, Mail, MessageCircle, X, Sparkles, ExternalLink } from "lucide-react";

interface OutreachModalProps {
  lead: ScoredLead;
  open: boolean;
  onClose: () => void;
  tier?: "free" | "pro";
}

export function OutreachModal({
  lead,
  open,
  onClose,
  tier = "free",
}: OutreachModalProps) {
  const [userService, setUserService] = useState("");
  const [channel, setChannel] = useState<"email" | "sms" | "linkedin" | "whatsapp">("email");
  const [tone, setTone] = useState<"professional" | "friendly" | "direct">("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [hooks, setHooks] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const isPro = tier === "pro";

  async function handleGenerate() {
    if (!userService.trim()) {
      setError("Describe what you're selling.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "draft",
          lead,
          userService: userService.trim(),
          channel,
          tone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      setSubject(data.subject ?? null);
      setBody(data.body);
      setHooks(data.personalizationHooks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    const text = subject ? `Subject: ${subject}\n\n${body}` : (body ?? "");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  const hasPhone = !!lead.phone;
  const hasEmail = !!lead.email;
  const waNumber = lead.phone?.replace(/[^0-9]/g, "");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-foreground/10 bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">AI Outreach</h2>
            <p className="text-sm text-foreground/60">{lead.businessName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-foreground/5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isPro && (
          <p className="mb-4 rounded-lg bg-foreground/5 px-3 py-2 text-xs text-foreground/50">
            Free plan: {20} AI messages included. Upgrade to Pro for 200/day.
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              What are you selling? *
            </label>
            <Input
              placeholder="e.g. website redesign, SEO services"
              value={userService}
              onChange={(e) => setUserService(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel</label>
              <select
                value={channel}
                onChange={(e) =>
                  setChannel(e.target.value as typeof channel)
                }
                disabled={loading}
                className="h-10 w-full rounded-lg border border-foreground/20 bg-background px-3 text-sm text-foreground"
              >
                <option value="email" className="bg-background text-foreground">Email</option>
                <option value="sms" className="bg-background text-foreground">SMS</option>
                <option value="linkedin" className="bg-background text-foreground">LinkedIn</option>
                <option value="whatsapp" className="bg-background text-foreground">WhatsApp</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as typeof tone)}
                disabled={loading}
                className="h-10 w-full rounded-lg border border-foreground/20 bg-background px-3 text-sm text-foreground"
              >
                <option value="professional" className="bg-background text-foreground">Professional</option>
                <option value="friendly" className="bg-background text-foreground">Friendly</option>
                <option value="direct" className="bg-background text-foreground">Direct</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !userService.trim()}
            className="w-full gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate message
          </Button>

          {body && (
            <div className="space-y-3 rounded-xl border border-foreground/10 p-4">
              {subject && (
                <div>
                  <p className="text-xs font-medium text-foreground/50">
                    Subject
                  </p>
                  <p className="text-sm">{subject}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-foreground/50">
                  Message
                </p>
                <p className="whitespace-pre-wrap text-sm">{body}</p>
              </div>
              {hooks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground/50">
                    Personalization used
                  </p>
                  <ul className="mt-1 list-inside list-disc text-xs text-foreground/60">
                    {hooks.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleCopy}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </Button>

                {hasEmail ? (
                  <a
                    href={`mailto:${lead.email}?subject=${encodeURIComponent(subject ?? "")}&body=${encodeURIComponent(body)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-foreground/20 px-3 text-xs text-foreground hover:bg-foreground/5"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                ) : (
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 text-xs text-red-500">
                    <Mail className="h-3.5 w-3.5" />
                    No email available
                  </span>
                )}

                {hasPhone && waNumber ? (
                  <a
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(body)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 text-xs text-green-600 dark:text-green-400 hover:bg-green-500/20"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                ) : (
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 text-xs text-red-500">
                    <MessageCircle className="h-3.5 w-3.5" />
                    No phone available
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
