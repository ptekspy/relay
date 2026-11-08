import { cn } from "@paddy-systems/lib/cn";
import type { ReactNode } from "react";

/** Definition-style metadata rows used across product and legal pages. */
export function FactRow({
  items,
  className,
}: {
  items: { term: string; value: ReactNode }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 border-t border-rule sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.term} className="border-b border-rule px-0 py-5 sm:pr-8">
          <dt className="label text-muted-foreground">{item.term}</dt>
          <dd className="mt-2 text-sm leading-relaxed">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
