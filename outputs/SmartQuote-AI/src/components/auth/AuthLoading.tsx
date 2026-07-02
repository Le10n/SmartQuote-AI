import { Sparkles } from "lucide-react";

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
        <Sparkles className="size-4 animate-pulse text-teal-600 dark:text-teal-300" />
        <span className="text-sm font-medium">Loading SmartQuote AI</span>
      </div>
    </div>
  );
}
