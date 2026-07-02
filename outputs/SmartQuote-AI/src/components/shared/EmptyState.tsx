import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className="relative flex min-h-60 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-[linear-gradient(135deg,var(--card),color-mix(in_oklab,var(--accent)_22%,transparent))] p-8 text-center shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <div className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--ring),transparent)] opacity-50" />
      <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-background/80 text-foreground shadow-lg shadow-black/[0.05]">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </motion.div>
  );
}
