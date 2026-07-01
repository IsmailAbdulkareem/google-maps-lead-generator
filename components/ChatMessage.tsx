"use client";

import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function isBulletLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith("•") || t.startsWith("-") || t.startsWith("*");
}

function isNumberedLine(line: string): boolean {
  return /^\d+\.\s/.test(line.trim());
}

export function ChatMessageContent({ content }: { content: string }) {
  const cleaned = content
    .replace(/\|[-:\s|]+\|/g, "")
    .replace(/^\|.*\|$/gm, "")
    .trim();

  if (!cleaned) return null;

  const blocks = cleaned.split(/\n\n+/);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim());

        if (lines.every(isBulletLine)) {
          return (
            <ul key={bi} className="ml-1 space-y-1.5">
              {lines.map((line, li) => (
                <li key={li} className="flex gap-2">
                  <span className="text-foreground/40">•</span>
                  <span>{renderInline(line.replace(/^[-•*]\s*/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every(isNumberedLine)) {
          return (
            <ol key={bi} className="ml-1 list-none space-y-1.5">
              {lines.map((line, li) => (
                <li key={li} className="flex gap-2">
                  <span className="font-medium text-foreground/50 tabular-nums">
                    {line.match(/^(\d+)\./)?.[1]}.
                  </span>
                  <span>
                    {renderInline(line.replace(/^\d+\.\s*/, ""))}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        if (lines.length === 1) {
          const line = lines[0]!;
          if (isBulletLine(line)) {
            return (
              <div key={bi} className="flex gap-2">
                <span className="text-foreground/40">•</span>
                <span>{renderInline(line.replace(/^[-•*]\s*/, ""))}</span>
              </div>
            );
          }
          return <p key={bi}>{renderInline(line)}</p>;
        }

        return (
          <div key={bi} className="space-y-1">
            {lines.map((line, li) => {
              if (isBulletLine(line)) {
                return (
                  <div key={li} className="flex gap-2">
                    <span className="text-foreground/40">•</span>
                    <span>{renderInline(line.replace(/^[-•*]\s*/, ""))}</span>
                  </div>
                );
              }
              return <p key={li}>{renderInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}
