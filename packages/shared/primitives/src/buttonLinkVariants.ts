import { cva, type VariantProps } from "class-variance-authority";

export const buttonLinkVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      spacing: {
        control: "h-9 px-4 py-2",
        inline: "p-0",
      },
      variant: {
        primary: "bg-primary-500 text-white hover:bg-primary-600",
        secondary: "bg-secondary-500 text-white hover:bg-secondary-600",
        success: "bg-success-500 text-white hover:bg-success-600",
        warning: "bg-warning-500 text-foreground-950 hover:bg-warning-600",
        danger: "bg-danger-500 text-white hover:bg-danger-600",
        outline:
          "border border-border-300 text-primary-600 hover:bg-primary-50",
        text: "text-primary-600 underline-offset-4 hover:text-primary-700 hover:underline",
      },
    },
    defaultVariants: {
      size: "md",
      spacing: "control",
      variant: "primary",
    },
  },
);

export type ButtonLinkVariantProps = VariantProps<typeof buttonLinkVariants>;
