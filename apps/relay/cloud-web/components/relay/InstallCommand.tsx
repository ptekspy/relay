"use client";

import { cn } from "@paddy-systems/lib/cn";
import { useId, useState } from "react";
import { CopyButton } from "./Code";

const MANAGERS = [
  {
    id: "npm",
    label: "npm",
    command: "npx --package @paddy-systems/relay-cli relay 3000",
  },
  {
    id: "pnpm",
    label: "pnpm",
    command: "pnpm dlx @paddy-systems/relay-cli relay 3000",
  },
  {
    id: "bun",
    label: "bun",
    command: "bunx @paddy-systems/relay-cli relay 3000",
  },
  {
    id: "global",
    label: "global",
    command: "npm i -g @paddy-systems/relay-cli && relay 3000",
  },
] as const;

/**
 * Accessible manual-activation tabs (WAI-ARIA tabs pattern) wrapping the
 * install command for each package manager.
 */
export function InstallCommand({ className }: { className?: string }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const current = MANAGERS[active] ?? MANAGERS[0];

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = MANAGERS.length - 1;
    let next = active;
    if (e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setActive(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div className={cn("border border-border bg-surface", className)}>
      <div
        role="tablist"
        aria-label="Package manager"
        onKeyDown={onKeyDown}
        className="flex flex-wrap items-center gap-px border-b border-rule"
      >
        {MANAGERS.map((m, i) => (
          <button
            key={m.id}
            id={`${id}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={active === i}
            aria-controls={`${id}-panel`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            className={cn(
              "relative min-h-11 px-4 font-mono text-xs tracking-[0.08em] transition-colors",
              active === i
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
            {active === i && (
              <span
                aria-hidden="true"
                className="spectrum-bg absolute inset-x-3 bottom-0 h-px"
              />
            )}
          </button>
        ))}
      </div>

      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-label={`Install with ${current.label}`}
        className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <code className="block font-mono text-[0.8125rem] leading-6 break-all">
            <span className="tok-prompt mr-2 select-none">$</span>
            {current.command}
          </code>
        </div>
        <CopyButton value={current.command} label="Copy" />
      </div>
    </div>
  );
}
