import { cn } from "@paddy-systems/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";

export function ArrowLink({
  href,
  children,
  className,
  external,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="border-b border-current pb-0.5">{children}</span>
      <span
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-1"
      >
        →
      </span>
    </>
  );
  const cls = cn(
    "group label inline-flex items-center gap-2 text-foreground hover:text-blue",
    className,
  );
  return external ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
