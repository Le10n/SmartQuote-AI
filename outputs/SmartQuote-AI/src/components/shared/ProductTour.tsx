import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Compass, FileText, LayoutDashboard, Settings, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import {
  completeProductTour,
  productTourRestartEvent,
  readProductTourCompleted,
  readProductTourProgress,
  saveProductTourProgress,
} from "@/services/product-tour.service";

interface TourStep {
  title: string;
  description: string;
  route?: string;
  selector?: string;
  fallbackSelector?: string;
  placement?: "right" | "auto";
  icon: LucideIcon;
  actionLabel?: string;
}

interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  width: number;
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to SmartQuote AI",
    description: "Build quotes, manage clients, track revenue and use AI to speed up sales workflows.",
    route: "/dashboard",
    icon: Sparkles,
  },
  {
    title: "Sidebar navigation",
    description: "Switch between Dashboard, Clients, Quotes, Products, Analytics and Settings.",
    selector: "[data-tour='sidebar']",
    placement: "right",
    icon: Compass,
  },
  {
    title: "Dashboard",
    description: "Track revenue, quote performance and AI-powered sales insights.",
    route: "/dashboard",
    selector: "[data-tour='dashboard-kpis']",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    description: "Manage your clients, contact details, notes and quote history.",
    route: "/clients",
    selector: "[data-tour='nav-clients']",
    icon: Compass,
  },
  {
    title: "Products",
    description: "Create reusable products and services for faster quote building.",
    route: "/products",
    selector: "[data-tour='nav-products']",
    icon: Compass,
  },
  {
    title: "Quotes",
    description: "Create, edit, duplicate, approve, reject and export quotes.",
    route: "/quotes",
    selector: "[data-tour='nav-quotes']",
    fallbackSelector: "[data-tour='quotes-page']",
    icon: FileText,
  },
  {
    title: "Quote Builder",
    description: "Build professional quotes with live calculations, tax, discounts, preview and AI help.",
    route: "/quotes",
    selector: "[data-tour='quote-builder-action']",
    icon: FileText,
  },
  {
    title: "AI Assistant",
    description: "Use AI to generate descriptions, improve proposal tone, suggest pricing and create follow-up emails.",
    selector: "[data-tour='ai-assistant-trigger']",
    icon: Sparkles,
  },
  {
    title: "PDF Export",
    description: "Export beautiful client-ready quote PDFs.",
    route: "/quotes",
    selector: "[data-tour='pdf-export']",
    fallbackSelector: "[data-tour='quotes-page']",
    icon: FileText,
  },
  {
    title: "Settings",
    description: "Customize company details, PDF settings, AI preferences, notifications and appearance.",
    route: "/settings",
    selector: "[data-tour='nav-settings']",
    icon: Settings,
  },
  {
    title: "Demo workspace",
    description: "This is a portfolio demo built by Leon Sošić. You can reset demo data anytime.",
    route: "/settings?tab=demo",
    selector: "[data-tour='demo-workspace']",
    icon: Sparkles,
  },
  {
    title: "You’re ready to explore SmartQuote AI.",
    description: "Use the dashboard, quote builder, AI assistant and PDF exports to experience the full demo workspace.",
    route: "/dashboard",
    icon: Check,
    actionLabel: "Start using SmartQuote AI",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function currentRoute(location: ReturnType<typeof useLocation>) {
  return location.pathname + location.search;
}

function getTargetElement(step: TourStep) {
  if (!step.selector) return null;
  return document.querySelector<HTMLElement>(step.selector) ?? (step.fallbackSelector ? document.querySelector<HTMLElement>(step.fallbackSelector) : null);
}

function rectFromElement(element: HTMLElement): TourRect {
  const padding = 10;
  const rect = element.getBoundingClientRect();
  return {
    top: clamp(rect.top - padding, 12, window.innerHeight - 24),
    left: clamp(rect.left - padding, 12, window.innerWidth - 24),
    width: Math.min(rect.width + padding * 2, window.innerWidth - 24),
    height: Math.min(rect.height + padding * 2, window.innerHeight - 24),
  };
}

function tooltipFromRect(rect: TourRect | null, placement: TourStep["placement"] = "auto"): TooltipPosition {
  const viewportPadding = 16;
  const gap = 18;
  const estimatedHeight = 320;
  const width = Math.min(window.innerWidth - viewportPadding * 2, window.innerWidth >= 768 ? 560 : 430);
  if (!rect) {
    return {
      width,
      left: Math.max(viewportPadding, (window.innerWidth - width) / 2),
      top: Math.max(92, window.innerHeight * 0.22),
    };
  }

  const maxTop = Math.max(viewportPadding, window.innerHeight - estimatedHeight - viewportPadding);
  const preferredTop = clamp(rect.top + Math.min(28, rect.height * 0.18), viewportPadding, maxTop);

  if (placement === "right" && window.innerWidth >= 640) {
    const rightEdge = rect.left + rect.width;
    const rightSpace = window.innerWidth - rightEdge - gap - viewportPadding;
    if (rightSpace >= 320) {
      const placedWidth = Math.min(width, rightSpace);
      return { width: placedWidth, left: rightEdge + gap, top: preferredTop };
    }

    const leftSpace = rect.left - gap - viewportPadding;
    if (leftSpace >= 320) {
      const placedWidth = Math.min(width, leftSpace);
      return { width: placedWidth, left: rect.left - gap - placedWidth, top: preferredTop };
    }
  }

  const below = rect.top + rect.height + gap;
  const above = rect.top - estimatedHeight - gap;
  const top = below + estimatedHeight < window.innerHeight - viewportPadding ? below : Math.max(viewportPadding, above);
  const left = clamp(rect.left + rect.width / 2 - width / 2, viewportPadding, window.innerWidth - width - viewportPadding);
  return { width, left, top };
}

const spotlightShadow =
  "0 0 0 9999px color-mix(in oklab, var(--background) 74%, transparent), 0 0 0 1px color-mix(in oklab, var(--ring) 64%, transparent), 0 0 44px color-mix(in oklab, var(--ring) 26%, transparent), 0 22px 80px color-mix(in oklab, black 18%, transparent)";

export function ProductTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<TourRect | null>(null);
  const [tooltip, setTooltip] = useState<TooltipPosition>(() => ({ top: 120, left: 24, width: 420 }));
  const [finishedPulse, setFinishedPulse] = useState(false);
  const step = tourSteps[stepIndex];
  const Icon = step.icon;
  const isLastStep = stepIndex === tourSteps.length - 1;
  const progress = ((stepIndex + 1) / tourSteps.length) * 100;

  const beginTour = useCallback((index = 0) => {
    const safeIndex = clamp(index, 0, tourSteps.length - 1);
    setStepIndex(safeIndex);
    setOpen(true);
    setFinishedPulse(false);
    saveProductTourProgress(safeIndex);
  }, []);

  const closeTour = useCallback((complete = true) => {
    setOpen(false);
    setSpotlight(null);
    if (complete) completeProductTour();
  }, []);

  const next = useCallback(() => {
    if (isLastStep) {
      setFinishedPulse(true);
      window.setTimeout(() => closeTour(true), 420);
      return;
    }

    setStepIndex((current) => {
      const nextIndex = Math.min(current + 1, tourSteps.length - 1);
      saveProductTourProgress(nextIndex);
      return nextIndex;
    });
  }, [closeTour, isLastStep]);

  const back = useCallback(() => {
    setStepIndex((current) => {
      const nextIndex = Math.max(0, current - 1);
      saveProductTourProgress(nextIndex);
      return nextIndex;
    });
  }, []);

  useEffect(() => {
    if (!env.demoMode || readProductTourCompleted()) return undefined;
    const timeout = window.setTimeout(() => beginTour(readProductTourProgress()), 650);
    return () => window.clearTimeout(timeout);
  }, [beginTour]);

  useEffect(() => {
    function restart() {
      beginTour(0);
    }

    window.addEventListener(productTourRestartEvent, restart);
    return () => window.removeEventListener(productTourRestartEvent, restart);
  }, [beginTour]);

  useEffect(() => {
    if (!open || !step.route) return;
    if (currentRoute(location) !== step.route) {
      navigate(step.route);
    }
  }, [location, navigate, open, step.route]);

  useEffect(() => {
    if (!open) return undefined;
    let frame = 0;
    let scrollTimeout = 0;

    function measureSpotlight() {
      const element = getTargetElement(step);
      if (!element) {
        setSpotlight(null);
        setTooltip(tooltipFromRect(null, step.placement));
        return;
      }

      const nextRect = rectFromElement(element);
      setSpotlight(nextRect);
      setTooltip(tooltipFromRect(nextRect, step.placement));
    }

    function scheduleMeasure() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measureSpotlight);
    }

    const element = getTargetElement(step);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
    scrollTimeout = window.setTimeout(scheduleMeasure, 180);

    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, true);
    return () => {
      window.clearTimeout(scrollTimeout);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure, true);
    };
  }, [location.pathname, location.search, open, step]);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeTour(true);
      }
      if (event.key === "Enter" || event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        back();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [back, closeTour, next, open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [open]);

  const tooltipStyle: CSSProperties = { top: tooltip.top, left: tooltip.left, width: tooltip.width };
  const fallbackBackdropClassName = step.selector
    ? "absolute inset-0 bg-background/76 will-change-[opacity]"
    : "absolute inset-0 bg-background/76 backdrop-blur-[3px] will-change-[opacity]";
  const spotlightStyle: CSSProperties | undefined = spotlight
    ? {
        width: spotlight.width,
        height: spotlight.height,
        boxShadow: spotlightShadow,
      }
    : undefined;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[90] pointer-events-auto touch-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16, ease: "easeOut" }}>
          {!spotlight ? (
            <motion.div className={fallbackBackdropClassName} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: "easeOut" }} />
          ) : null}

          {spotlight ? (
            <motion.div
              className="pointer-events-none absolute left-0 top-0 rounded-xl border border-ring/70 bg-transparent ring-1 ring-white/20 will-change-transform"
              style={spotlightStyle}
              initial={false}
              animate={{ x: spotlight.left, y: spotlight.top, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.7 }}
            />
          ) : null}

          {finishedPulse ? <motion.div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ring/60 bg-[var(--accent-soft)]" initial={{ scale: 0.45, opacity: 0 }} animate={{ scale: 2.8, opacity: 0 }} transition={{ duration: 0.42, ease: "easeOut" }} /> : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={step.title}
              className="pointer-events-auto absolute max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border/80 bg-card/94 p-4 text-card-foreground shadow-2xl shadow-black/20 backdrop-blur-2xl will-change-transform sm:p-5"
              style={tooltipStyle}
              initial={{ opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.985 }}
              transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.7 }}
              role="dialog"
              aria-live="polite"
              aria-label="SmartQuote AI product tour"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--ring),transparent)] opacity-70" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="ai-orbit-glow flex size-10 shrink-0 items-center justify-center rounded-lg bg-[image:var(--accent-gradient)] text-primary-foreground shadow-sm"><Icon className="size-4" /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Step {stepIndex + 1} of {tourSteps.length}</p>
                    <h2 className="mt-1 text-base font-semibold tracking-normal">{step.title}</h2>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="-mr-2 -mt-2" aria-label="Skip product tour" onClick={() => closeTour(true)}>
                  <X className="size-4" />
                </Button>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">{step.description}</p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <motion.div className="h-full origin-left rounded-full bg-[linear-gradient(90deg,var(--chart-1),var(--chart-2))] will-change-transform" initial={false} animate={{ scaleX: progress / 100 }} transition={{ duration: 0.22, ease: "easeOut" }} />
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => closeTour(true)}>Skip tour</Button>
                <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={back} disabled={stepIndex === 0}><ArrowLeft className="size-4" />Back</Button>
                  <Button type="button" variant="premium" size="sm" className="w-full min-w-0 whitespace-normal px-4 text-center leading-5 sm:w-auto sm:whitespace-nowrap" onClick={next}>
                    {isLastStep ? step.actionLabel ?? "Finish" : "Next"}
                    {isLastStep ? <Check className="size-4" /> : <ArrowRight className="size-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
