"use client";

import { type ReactNode, useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Lang = "bash" | "text" | "ts";

const BASH_KEYWORDS = new Set([
  "npx",
  "npm",
  "pnpm",
  "bun",
  "yarn",
  "cd",
  "export",
  "sudo",
]);
const TS_KEYWORDS = new Set([
  "import",
  "from",
  "const",
  "let",
  "return",
  "export",
  "default",
  "await",
  "async",
  "function",
  "if",
  "else",
]);

/** Tiny dependency-free highlighter — enough for commands and short snippets. */
function highlight(line: string, lang: Lang): ReactNode {
  if (lang === "text") return line;

  const commentIndex = line.indexOf("#");
  if (lang === "bash" && commentIndex === 0) {
    return <span className="tok-com">{line}</span>;
  }

  const parts = line.split(/(\s+)/);
  let seenCommand = false;

  return parts.map((part, i) => {
    if (part.trim() === "") return part;
    const key = `${i}-${part}`;

    if (lang === "bash") {
      if (BASH_KEYWORDS.has(part))
        return (
          <span key={key} className="tok-kw">
            {part}
          </span>
        );
      if (part.startsWith("--") || part.startsWith("-")) {
        return (
          <span key={key} className="tok-flag">
            {part}
          </span>
        );
      }
      if (/^["'].*["']$/.test(part))
        return (
          <span key={key} className="tok-str">
            {part}
          </span>
        );
      if (/^\d+$/.test(part))
        return (
          <span key={key} className="tok-num">
            {part}
          </span>
        );
      if (!seenCommand) {
        seenCommand = true;
        return (
          <span key={key} className="tok-cmd">
            {part}
          </span>
        );
      }
      return part;
    }

    if (TS_KEYWORDS.has(part))
      return (
        <span key={key} className="tok-kw">
          {part}
        </span>
      );
    if (/^["'`].*["'`]$/.test(part))
      return (
        <span key={key} className="tok-str">
          {part}
        </span>
      );
    if (/^\d/.test(part))
      return (
        <span key={key} className="tok-num">
          {part}
        </span>
      );
    return part;
  });
}

export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard unavailable — the text stays selectable */
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "border border-border px-3 py-1.5 font-mono text-[0.6875rem] tracking-[0.12em] uppercase",
        "text-muted-foreground transition-colors hover:border-input hover:text-foreground",
        "min-h-9 shrink-0",
        className,
      )}
    >
      <span aria-hidden="true">{copied ? "Copied" : label}</span>
      <span className="sr-only">
        {copied ? "Copied to clipboard" : `${label} to clipboard: ${value}`}
      </span>
    </button>
  );
}

export function CodeBlock({
  code,
  lang = "bash",
  prompt = false,
  copy = true,
  caption,
  className,
}: {
  code: string;
  lang?: Lang;
  /** Render a `$` gutter for shell commands. */
  prompt?: boolean;
  copy?: boolean;
  caption?: string;
  className?: string;
}) {
  const id = useId();
  const lines = code.replace(/\n$/, "").split("\n");
  const lineOccurrences = new Map<string, number>();
  const keyedLines = lines.map((line) => {
    const occurrence = lineOccurrences.get(line) ?? 0;
    lineOccurrences.set(line, occurrence + 1);
    return { id: `${line}-${occurrence}`, line };
  });

  return (
    <figure className={cn("border border-border bg-surface", className)}>
      {(caption || copy) && (
        <div className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
          <figcaption id={`${id}-cap`} className="label truncate">
            {caption ?? (prompt ? "shell" : lang)}
          </figcaption>
          {copy && <CopyButton value={code} />}
        </div>
      )}
      <section
        aria-labelledby={caption ? `${id}-cap` : undefined}
        aria-label={caption ? undefined : "Code sample"}
        className="overflow-x-auto px-3 py-3 focus-visible:outline-offset-[-2px]"
      >
        <pre className="w-max min-w-full font-mono text-[0.8125rem] leading-6">
          <code>
            {keyedLines.map(({ id: lineId, line }) => (
              <span key={lineId} className="block">
                {prompt && (
                  <span className="tok-prompt mr-2 select-none">$</span>
                )}
                {highlight(line, lang)}
              </span>
            ))}
          </code>
        </pre>
      </section>
    </figure>
  );
}
