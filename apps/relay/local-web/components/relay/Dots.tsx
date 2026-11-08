import { cn } from "@paddy-systems/lib/cn";

type DotsProps = {
  /** Layout of the three-dot relay mark. */
  orientation?: "horizontal" | "vertical";
  /** Animate the relay pulse. Decorative only. */
  active?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "size-1",
  md: "size-1.5",
  lg: "size-2.5",
} as const;

const hues = ["bg-blue", "bg-violet", "bg-magenta"] as const;

/**
 * The Relay mark: three dots running blue -> violet -> magenta.
 * Purely decorative, so it is hidden from assistive technology.
 */
export function Dots({
  orientation = "horizontal",
  active = false,
  size = "md",
  className,
}: DotsProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center",
        orientation === "horizontal" ? "flex-row gap-1" : "flex-col gap-1",
        className,
      )}
    >
      {hues.map((hue, i) => (
        <span
          key={hue}
          className={cn(
            sizes[size],
            hue,
            active ? "opacity-100" : "opacity-70",
          )}
          style={
            active
              ? {
                  animation:
                    "relay-dot 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  animationDelay: `${i * 0.18}s`,
                }
              : undefined
          }
        />
      ))}
    </span>
  );
}

/** Wordmark: three dots + "relay". */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Dots size="sm" />
      <span className="font-mono text-[0.95rem] font-medium tracking-tight lowercase">
        relay
      </span>
    </span>
  );
}
