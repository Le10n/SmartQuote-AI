import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="group relative">
      <select
        className={cn(
          "flex h-10 w-full appearance-none rounded-lg border border-input bg-background/80 px-3 py-2 pr-9 text-sm shadow-sm shadow-black/[0.02] outline-none transition-all duration-200 hover:border-ring/50 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-transform duration-200 group-focus-within:rotate-180" />
    </div>
  );
}
