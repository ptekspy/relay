import { cn } from "@paddy-systems/lib/cn";
import { CopyButton } from "../CopyButton/CopyButton";

/** Horizontally scrollable technical code line, optionally copyable. */
export function Code({
  children,
  className,
  label = "Command",
  copyable = false,
  copyClassName,
}: {
  children: string;
  className?: string;
  label?: string;
  copyable?: boolean;
  copyClassName?: string;
}) {
  const pre = (
    // biome-ignore lint/a11y/useSemanticElements: code group role is appropriate for code block container
    <pre
      role="group"
      aria-label={label}
      className={cn(
        "glow w-full min-w-0 max-w-full overflow-x-auto border border-rule bg-[oklch(0.12_0.02_278)] px-4 py-3.5 text-[0.75rem] leading-relaxed text-foreground sm:px-5 sm:text-[0.8125rem]",
        className,
      )}
    >
      <code className="font-mono whitespace-pre">{children}</code>
    </pre>
  );
  if (!copyable) return pre;
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
      {pre}
      <CopyButton value={children} className={copyClassName} />
    </div>
  );
}
