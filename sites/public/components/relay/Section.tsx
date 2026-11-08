import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Numbered section header, carried over from the Paddy Systems system:
 * mono index, rule, then a confident title.
 */
export function Section({
  index,
  eyebrow,
  title,
  lede,
  children,
  className,
  id,
}: {
  index: string;
  eyebrow: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative isolate overflow-hidden border-t border-rule py-16 md:py-24",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="ghost-numeral absolute -top-6 right-2 -z-10 hidden select-none lg:block"
      >
        {index}
      </span>
      <div className="shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="label flex items-center gap-4">
              <span
                aria-hidden="true"
                className="pulse-dot block size-[6px] bg-magenta"
              />
              § {index} — {eyebrow}
              <span
                aria-hidden="true"
                className="spectrum-rule ml-2 hidden max-w-[10rem] flex-1 sm:block"
              />
            </p>
            <h2 className="display-big chroma spectrum-text mt-6 pb-1">
              {title}
            </h2>
            {lede && (
              <p className="mt-6 max-w-[56ch] border-l-2 border-violet/60 pl-5 text-base text-foreground/80 md:text-lg">
                {lede}
              </p>
            )}
          </div>
        </div>
        {children && <div className="mt-10 md:mt-14">{children}</div>}
      </div>
    </section>
  );
}

/** Simple architecture diagram built from the three-dot motif. */
export function Architecture() {
  return (
    <figure className="border border-border bg-surface p-6 md:p-10">
      <div className="mx-auto flex max-w-md flex-col items-center gap-0 text-center">
        <div className="w-full border border-border px-4 py-4">
          <p className="label">Your dev server</p>
          <p className="mt-1 font-mono text-sm">localhost:3000</p>
        </div>

        <span aria-hidden="true" className="h-6 w-px bg-rule" />
        <div className="relative flex w-full items-center justify-center border border-border px-4 py-5">
          <span
            aria-hidden="true"
            className="spectrum-bg absolute inset-x-0 top-0 h-px opacity-80"
          />
          <div className="flex flex-col items-center gap-2">
            <span className="label">relay</span>
            <span className="flex gap-1.5" aria-hidden="true">
              <span
                className="size-2 bg-blue"
                style={{ animation: "relay-dot 1.5s infinite" }}
              />
              <span
                className="size-2 bg-violet"
                style={{
                  animation: "relay-dot 1.5s infinite",
                  animationDelay: "0.18s",
                }}
              />
              <span
                className="size-2 bg-magenta"
                style={{
                  animation: "relay-dot 1.5s infinite",
                  animationDelay: "0.36s",
                }}
              />
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              local gateway · no public port
            </span>
          </div>
        </div>
        <span aria-hidden="true" className="h-6 w-px bg-rule" />

        <div className="grid w-full grid-cols-3 gap-px border border-border">
          {["Phone", "Tablet", "Laptop"].map((d) => (
            <div
              key={d}
              className="border-r border-rule px-2 py-4 last:border-0"
            >
              <p className="font-mono text-xs">{d}</p>
              <p className="mt-1 text-[0.6875rem] text-ok">paired</p>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-6 text-center text-sm text-muted-foreground">
        Traffic stays on your network. Relay issues a short access code instead
        of exposing a port.
      </figcaption>
    </figure>
  );
}
