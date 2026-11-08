"use client";

import NextLink from "next/link";
import type { ComponentPropsWithoutRef, JSX } from "react";
import {
  type ButtonLinkVariantProps,
  buttonLinkVariants,
} from "../buttonLinkVariants";

export type LinkProps = ComponentPropsWithoutRef<typeof NextLink> &
  Omit<ButtonLinkVariantProps, "spacing">;

export function Link({
  className,
  size,
  variant,
  ...props
}: LinkProps): JSX.Element {
  return (
    <NextLink
      className={buttonLinkVariants({
        className,
        size,
        spacing: variant === "text" ? "inline" : "control",
        variant,
      })}
      {...props}
    />
  );
}
