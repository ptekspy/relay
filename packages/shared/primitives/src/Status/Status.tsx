import { cn } from "@paddy-systems/lib/cn";

const STATUS_TONE: Record<string, string> = {
  "AVAILABLE NOW": "text-blue before:bg-blue",
  "IN DEVELOPMENT": "text-violet before:bg-violet",
  UNANNOUNCED: "text-magenta before:bg-magenta",
};

export function Status({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label inline-flex items-center gap-2 before:block before:size-[7px] before:content-['']",
        STATUS_TONE[value] ?? "text-foreground before:bg-foreground",
        className,
      )}
    >
      {value}
    </span>
  );
}
