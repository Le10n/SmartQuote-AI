import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2, X, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastContext, type ToastContextValue, type ToastIconMap, type ToastMessage, type ToastType } from "@/hooks/toast-context";
import { cn } from "@/lib/utils";

const icons: ToastIconMap = {
  success: <CheckCircle2 className="size-4 text-emerald-500" />,
  error: <AlertCircle className="size-4 text-rose-500" />,
  warning: <TriangleAlert className="size-4 text-amber-500" />,
  loading: <Loader2 className="size-4 animate-spin text-muted-foreground" />,
  info: <Info className="size-4 text-sky-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [{ id, ...toast }, ...current].slice(0, 5));
    if (toast.type !== "loading") {
      window.setTimeout(() => dismiss(id), 5200);
    }
    return id;
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(() => ({
    show,
    dismiss,
    success: (title, description, action) => show({ type: "success", title, description, action }),
    error: (title, description, action) => show({ type: "error", title, description, action }),
    warning: (title, description, action) => show({ type: "warning", title, description, action }),
    loading: (title, description) => show({ type: "loading", title, description }),
    info: (title, description, action) => show({ type: "info", title, description, action }),
  }), [dismiss, show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[90] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 32, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative overflow-hidden rounded-lg border border-border bg-popover/95 p-4 text-popover-foreground shadow-2xl shadow-black/12 backdrop-blur-xl"
            >
              {toast.type !== "loading" ? <motion.div className="absolute inset-x-0 bottom-0 h-0.5 bg-[linear-gradient(90deg,var(--chart-1),var(--chart-2))]" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 5.2, ease: "linear" }} style={{ transformOrigin: "left" }} /> : null}
              <div className="flex gap-3">
                <div className="mt-0.5">{icons[toast.type as ToastType]}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{toast.description}</p> : null}
                  {toast.action ? (
                    <Button className="mt-3" size="sm" variant="outline" onClick={() => void toast.action?.onClick()} data-cursor="Click">
                      {toast.action.label}
                    </Button>
                  ) : null}
                </div>
                <button className={cn("rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground")} onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" data-cursor="Click">
                  <X className="size-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
