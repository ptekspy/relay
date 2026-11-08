import { cn } from "@paddy-systems/lib/cn";
import type { ReactNode } from "react";

export function Prose({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-[68ch] space-y-5 text-[0.975rem] leading-[1.75] text-foreground/85",
        "[&_h3]:mt-12 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-[-0.02em] [&_h3]:text-foreground",
        "[&_ul]:space-y-2 [&_li]:pl-5 [&_li]:relative [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.65em] [&_li]:before:size-[5px] [&_li]:before:bg-foreground/60 [&_li]:before:content-['']",
        className,
      )}
    >
      {children}
    </div>
  );
}
