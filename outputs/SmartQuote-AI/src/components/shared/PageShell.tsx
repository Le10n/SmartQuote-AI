import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useWorkspacePreferences } from "@/hooks/use-workspace-preferences";

interface PageShellProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

const routeOrder = ["/dashboard", "/clients", "/quotes", "/products", "/analytics", "/settings"];
let previousRouteIndex = 0;

export function PageShell({ title, description, actions, children }: PageShellProps) {
  const location = useLocation();
  const { preferences } = useWorkspacePreferences();
  const currentRouteIndex = Math.max(0, routeOrder.indexOf(location.pathname));
  const direction = currentRouteIndex >= previousRouteIndex ? 1 : -1;
  previousRouteIndex = currentRouteIndex;

  return (
    <motion.section
      initial={preferences.animations ? { opacity: 0, x: direction * 18, y: 8 } : false}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={preferences.animations ? { opacity: 0, x: direction * -12, y: -4 } : undefined}
      transition={{ duration: preferences.animations ? 0.22 : 0, ease: "easeOut" }}
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-24 lg:pb-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="size-3.5 text-teal-600 dark:text-teal-300" />
            AI-powered workspace
          </div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </motion.section>
  );
}
