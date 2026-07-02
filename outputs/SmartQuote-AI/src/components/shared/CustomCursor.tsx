import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useWorkspacePreferences } from "@/hooks/use-workspace-preferences";

interface CursorState {
  visible: boolean;
  active: boolean;
  label: string;
}

function restoreBrowserCursor() {
  document.documentElement.classList.remove("custom-cursor-enabled");
  document.documentElement.style.cursor = "";
  document.body.style.cursor = "";
}

function labelForElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return "";
  const element = target.closest<HTMLElement>("[data-cursor], button, a, input, textarea, select");
  if (!element) return "";

  const explicit = element.dataset.cursor;
  if (explicit) return explicit;
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return "Edit";
  if (element instanceof HTMLAnchorElement) return "Open";
  const text = element.textContent?.trim().toLowerCase() ?? "";
  if (text.includes("create") || text.includes("add") || text.includes("new")) return "Create";
  if (text.includes("ai")) return "AI";
  if (text.includes("edit")) return "Edit";
  return "Click";
}

export function CustomCursor() {
  const location = useLocation();
  const { preferences } = useWorkspacePreferences();
  const enabledRoute = !["/login", "/register", "/forgot-password", "/verify-email"].includes(location.pathname);
  const cursorEnabled = preferences.customCursor && enabledRoute;
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 520, damping: 36, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 520, damping: 36, mass: 0.35 });
  const [state, setState] = useState<CursorState>({ visible: false, active: false, label: "" });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const canUseCursor = cursorEnabled && !modalOpen && window.matchMedia("(pointer: fine)").matches;
    if (!canUseCursor) {
      restoreBrowserCursor();
      setState({ visible: false, active: false, label: "" });
      return undefined;
    }

    function onPointerMove(event: PointerEvent) {
      x.set(event.clientX);
      y.set(event.clientY);
      const label = labelForElement(event.target);
      setState({ visible: true, active: Boolean(label), label });
    }

    function onPointerLeave() {
      setState((current) => ({ ...current, visible: false }));
    }

    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    document.documentElement.classList.add("custom-cursor-enabled");

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
      restoreBrowserCursor();
    };
  }, [cursorEnabled, location.pathname, modalOpen, x, y]);

  useEffect(() => {
    function syncModalState(event?: Event) {
      if (event instanceof CustomEvent && typeof event.detail?.open === "boolean") {
        setModalOpen(event.detail.open);
        return;
      }

      setModalOpen(document.documentElement.classList.contains("smartquote-modal-open"));
    }

    syncModalState();
    window.addEventListener("smartquote:modal-state", syncModalState);
    return () => window.removeEventListener("smartquote:modal-state", syncModalState);
  }, []);

  useEffect(() => {
    if (!cursorEnabled || modalOpen) {
      restoreBrowserCursor();
      setState({ visible: false, active: false, label: "" });
    }
  }, [cursorEnabled, modalOpen]);

  if (!cursorEnabled || modalOpen) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden items-center justify-center rounded-full border border-foreground/20 bg-background/40 text-[10px] font-medium text-foreground shadow-xl shadow-black/10 backdrop-blur-md md:flex"
      style={{ x: springX, y: springY }}
      animate={{
        opacity: state.visible ? 1 : 0,
        scale: state.active ? 1.9 : 1,
        width: state.active ? 34 : 18,
        height: state.active ? 34 : 18,
        translateX: state.active ? -17 : -9,
        translateY: state.active ? -17 : -9,
      }}
      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.4 }}
    >
      {state.active && state.label ? <span className="scale-[0.58] whitespace-nowrap opacity-80">{state.label}</span> : null}
    </motion.div>
  );
}
