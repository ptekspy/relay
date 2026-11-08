import Link from "next/link";
import type { ReactNode } from "react";

/** Shared shell for a documentation page: eyebrow, h1, lede, prose, next link. */
export function DocPage({
  eyebrow,
  title,
  lede,
  children,
  next,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: ReactNode;
  next?: { to: string; label: string };
}) {
  return (
    <article className="max-w-2xl">
      <p className="label">{eyebrow}</p>
      <h1 className="mt-4 text-3xl font-medium tracking-tight md:text-[2.5rem] md:leading-[1.1]">
        {title}
      </h1>
      {lede && <p className="mt-4 text-lg text-muted-foreground">{lede}</p>}
      <div className="mt-10 space-y-8">{children}</div>
      {next && (
        <div className="mt-14 border-t border-rule pt-6">
          <p className="label">Next</p>
          <Link
            href={next.to}
            className="mt-2 inline-flex min-h-11 items-center gap-2 text-base transition-colors hover:text-muted-foreground"
          >
            {next.label} <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </article>
  );
}

export function DocSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id}>
      <h2 className="text-xl font-medium tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-[0.9375rem] leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
