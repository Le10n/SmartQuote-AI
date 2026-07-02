import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 shadow-emerald-900/[0.03] dark:text-emerald-300",
        warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 shadow-amber-900/[0.03] dark:text-amber-300",
        info: "border-sky-500/25 bg-sky-500/10 text-sky-700 shadow-sky-900/[0.03] dark:text-sky-300",
        danger: "border-rose-500/25 bg-rose-500/10 text-rose-700 shadow-rose-900/[0.03] dark:text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
