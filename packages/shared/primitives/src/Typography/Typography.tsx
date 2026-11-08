import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ElementType, JSX } from "react";

export const typographyVariants = cva("font-sans antialiased", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    color: {
      primary: "text-foreground-950",
      secondary: "text-foreground-700",
      success: "text-success-600",
      warning: "text-warning-600",
      danger: "text-danger-600",
      muted: "text-muted-600",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "regular",
    color: "primary",
  },
});

export type TypographyVariantProps = VariantProps<typeof typographyVariants>;

export type TypographyProps = Omit<ComponentPropsWithoutRef<"p">, "color"> &
  TypographyVariantProps & {
    as?: ElementType;
  };

export function Typography({
  as: Component = "p",
  className,
  color,
  size,
  weight,
  ...props
}: TypographyProps): JSX.Element {
  return (
    <Component
      className={typographyVariants({
        className,
        color,
        size,
        weight,
      })}
      {...props}
    />
  );
}
