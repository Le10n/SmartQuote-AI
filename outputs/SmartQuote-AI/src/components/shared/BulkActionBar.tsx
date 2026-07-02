import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  children: ReactNode;
}

export function BulkActionBar({ selectedCount, onClear, children }: BulkActionBarProps) {
  return (
    <AnimatePresence initial={false}>
      {selectedCount > 0 ? (
        <motion.div
          className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/50 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <div>
            <p className="text-sm font-medium">{selectedCount} selected</p>
            <p className="text-xs text-muted-foreground">Apply bulk actions to the current view.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {children}
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              <X className="size-4" />
              Clear
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
