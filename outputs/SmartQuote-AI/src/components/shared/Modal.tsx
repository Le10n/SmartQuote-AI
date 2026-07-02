import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useWorkspacePreferences } from "@/hooks/use-workspace-preferences";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  size?: "md" | "lg" | "xl";
  children: ReactNode;
  onClose: () => void;
}

const modalStateEvent = "smartquote:modal-state";
let openModalCount = 0;

const sizes = {
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-[86rem]",
};

function publishModalState() {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("smartquote-modal-open", openModalCount > 0);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(modalStateEvent, { detail: { open: openModalCount > 0 } }));
  }
}

export function Modal({ open, title, description, size = "md", children, onClose }: ModalProps) {
  const titleId = useId();
  const descriptionId = description ? titleId + "-description" : undefined;
  const { preferences } = useWorkspacePreferences();

  useEffect(() => {
    if (!open) return undefined;

    openModalCount += 1;
    publishModalState();

    return () => {
      openModalCount = Math.max(0, openModalCount - 1);
      publishModalState();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] bg-background/75 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          initial={preferences.animations ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: preferences.animations ? 0.18 : 0, ease: "easeOut" }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div
            className="flex min-h-full items-center justify-center p-3 sm:p-4 lg:ml-[var(--app-sidebar-offset)] lg:w-[calc(100vw_-_var(--app-sidebar-offset))]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) onClose();
            }}
          >
            <motion.div
              className={cn(
                "max-h-[94vh] w-full overflow-hidden rounded-lg border border-border/80 bg-card text-card-foreground shadow-2xl shadow-black/20",
                sizes[size]
              )}
              initial={preferences.animations ? { opacity: 0, y: 18, scale: 0.97 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: preferences.animations ? 0.2 : 0, ease: "easeOut" }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-border bg-secondary/20 p-5">
                <div>
                  <h2 id={titleId} className="text-lg font-semibold tracking-normal">{title}</h2>
                  {description ? <p id={descriptionId} className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
                </div>
                <Button title="Close" aria-label="Close dialog" type="button" variant="ghost" size="icon" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
              <div className="max-h-[calc(94vh_-_88px)] overflow-y-auto p-4 premium-scrollbar sm:p-5">{children}</div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
