"use client";

import { cn } from "@paddy-systems/lib/cn";
import { useState } from "react";

export function CopyButton({
  value,
  className,
}: {
  value: string;
  className?: string | undefined;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className={cn(
        "label inline-flex min-h-11 shrink-0 items-center justify-center border border-rule px-5 text-foreground transition-colors hover:bg-foreground hover:text-background",
        className,
      )}
    >
      {copied ? "Copied" : "Copy"}
      <span className="sr-only"> command to clipboard</span>
    </button>
  );
}
