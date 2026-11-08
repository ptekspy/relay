import { cn } from "@paddy-systems/lib/cn";
import type { ReactNode } from "react";
import { Container } from "../Container/Container";
import { Label } from "../Label/Label";

/** Numbered section wrapper with a hairline rule and monospace index. */
export function Section({
  index,
  title,
  children,
  className,
  id,
}: {
  index?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  // "§ 03 — Philosophy" → "03" for the giant ghost numeral behind the heading.
  const numeral = index?.match(/\d+/)?.[0];

  return (
    <section
      id={id}
      className={cn(
        "relative isolate rule-t py-24 sm:py-28 lg:py-40",
        className,
      )}
    >
      {numeral && (
        <span
          aria-hidden="true"
          className="ghost-numeral parallax-slow absolute -right-4 -top-10 -z-10 hidden sm:block"
        >
          {numeral}
        </span>
      )}
      <Container>
        {(index || title) && (
          <div className="mb-14 sm:mb-20">
            {index && (
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="pulse-dot block size-[7px] bg-blue"
                />
                <Label className="text-foreground/80">{index}</Label>
                <span
                  aria-hidden="true"
                  className="spectrum-rule max-w-[36%] flex-1"
                />
              </div>
            )}
            {title && (
              <h2 className="clip-in mt-6 max-w-[18ch] text-4xl font-extrabold uppercase leading-[0.86] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
                {title}
              </h2>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
