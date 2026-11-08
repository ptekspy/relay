"use client";

import { cn } from "@paddy-systems/lib/cn";
import Link from "next/link";
import type { ComponentPropsWithoutRef, JSX, ReactNode } from "react";
import {
  type ButtonLinkVariantProps,
  buttonLinkVariants,
} from "../buttonLinkVariants";

export type ButtonProps = ComponentPropsWithoutRef<"button"> &
  Omit<ButtonLinkVariantProps, "spacing">;

export function Button({
  className,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={buttonLinkVariants({
        className,
        size,
        spacing: "control",
        variant,
      })}
      type={type}
      {...props}
    />
  );
}
export function ButtonOld({
  href,
  children,
  variant = "solid",
  external,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline" | "invert";
  external?: boolean;
  className?: string;
}) {
  const cls = cn(
    "label sheen group relative inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden px-9 py-4 transition-all duration-300 hover:-translate-y-0.5",
    variant === "solid" &&
      "spectrum-bg text-[oklch(0.14_0.02_278)] shadow-[0_0_30px_-12px_oklch(0.7_0.2_300)] hover:shadow-[0_0_60px_-6px_oklch(0.7_0.2_300_/_80%)]",
    variant === "outline" &&
      "border border-foreground/35 text-foreground hover:border-transparent hover:spectrum-bg hover:text-[oklch(0.14_0.02_278)]",
    variant === "invert" &&
      "bg-background text-foreground hover:spectrum-bg hover:text-[oklch(0.14_0.02_278)]",
    className,
  );
  const inner = (
    <>
      <span aria-hidden="true" className="sheen-layer" />
      <span className="relative">{children}</span>
      <span
        aria-hidden="true"
        className="relative transition-transform group-hover:translate-x-1"
      >
        →
      </span>
    </>
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
