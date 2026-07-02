import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends ComponentProps<"div"> {
  value: number;
}

export function Progress({ value, className, ...props }: ProgressProps) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)} {...props}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: String(Math.min(Math.max(value, 0), 100)) + "%" }}
      />
    </div>
  );
}
