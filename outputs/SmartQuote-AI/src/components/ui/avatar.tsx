import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground",
        className
      )}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("flex size-full items-center justify-center", className)} {...props} />;
}
