import { cn } from "@paddy-systems/lib/cn";
import type { ReactNode } from "react";

export function Label({
  children,
  className,
  as: As = "span",
}: {
  children: ReactNode;
  className?: string;
  as?: "span" | "p" | "div" | "dt";
}) {
  return (
    <As className={cn("label text-muted-foreground", className)}>{children}</As>
  );
}
