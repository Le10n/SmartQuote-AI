import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, FileText, Sparkles, Zap } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  busy?: boolean;
  success?: boolean;
}

const particles = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  left: 8 + ((index * 37) % 84),
  top: 10 + ((index * 53) % 78),
  delay: (index % 7) * 0.18,
  size: 2 + (index % 3),
}));

export function AuthLayout({ title, description, children, busy, success }: AuthLayoutProps) {
  const { user, loading } = useAuth();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 70, damping: 22, mass: 0.4 });
  const springY = useSpring(pointerY, { stiffness: 70, damping: 22, mass: 0.4 });
  const cardX = useTransform(springX, [-0.5, 0.5], [-18, 18]);
  const cardY = useTransform(springY, [-0.5, 0.5], [-14, 14]);
  const glowX = useTransform(springX, [-0.5, 0.5], ["38%", "62%"]);
  const glowY = useTransform(springY, [-0.5, 0.5], ["30%", "58%"]);
  const glowBackground = useTransform([glowX, glowY], ([x, y]) => "radial-gradient(circle at " + x + " " + y + ", color-mix(in oklab, var(--ring) 28%, transparent), transparent 34%)");

  if (!busy && !loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  function onPointerMove(event: MouseEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground auth-cursor-surface" onMouseMove={onPointerMove}>
      <div className="absolute inset-0 auth-noise" />
      <motion.div className="absolute inset-0 opacity-80" style={{ background: glowBackground }} />
      <section className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
        <div className="relative hidden overflow-hidden border-r border-border/70 px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div className="absolute inset-0 auth-grid opacity-70" />
          <motion.div className="absolute -left-24 top-20 size-80 rounded-full bg-[var(--accent-soft)] blur-3xl" animate={{ x: [0, 38, 0], y: [0, -22, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="absolute bottom-4 right-4 size-96 rounded-full bg-[color-mix(in_oklab,var(--brand-accent)_14%,transparent)] blur-3xl" animate={{ x: [0, -30, 0], y: [0, 28, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="absolute rounded-full bg-foreground/30"
              style={{ left: particle.left + "%", top: particle.top + "%", width: particle.size, height: particle.size }}
              animate={{ opacity: [0.18, 0.7, 0.18], y: [0, -14, 0], scale: [1, 1.35, 1] }}
              transition={{ duration: 4.5 + particle.delay, repeat: Infinity, delay: particle.delay, ease: "easeInOut" }}
            />
          ))}

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xl shadow-black/10">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">SmartQuote AI</p>
              <p className="text-sm text-muted-foreground">Portfolio Edition</p>
            </div>
          </div>

          <div className="relative z-10 max-w-2xl space-y-8">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-xl">
                <span className="size-1.5 rounded-full bg-emerald-500" /> AI quote operations workspace
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-normal text-foreground xl:text-6xl">Close cleaner quotes with less manual work.</h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">A polished revenue workspace for clients, products, quotes, AI copy, branded PDFs, and approval-ready follow-up.</p>
            </motion.div>

            <motion.div className="grid max-w-xl gap-4 sm:grid-cols-2" style={{ x: cardX, y: cardY }}>
              <div className="rounded-xl border border-border/70 bg-background/58 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">Approval velocity</span><Zap className="size-4 text-emerald-500" /></div>
                <p className="mt-6 text-3xl font-semibold">42%</p>
                <p className="mt-1 text-xs text-muted-foreground">Faster quote turnaround in demo pipeline</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/58 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl sm:translate-y-8">
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">Live quote</span><FileText className="size-4 text-sky-500" /></div>
                <div className="mt-5 space-y-2">
                  <div className="h-2 rounded-full bg-foreground/15" />
                  <div className="h-2 w-3/4 rounded-full bg-foreground/15" />
                  <div className="h-2 w-1/2 rounded-full bg-foreground/15" />
                </div>
                <p className="mt-4 text-xs text-muted-foreground">AI description generated</p>
              </div>
            </motion.div>
          </div>

          <div className="relative z-10 flex items-center justify-between rounded-xl border border-border/70 bg-background/55 p-4 text-sm text-muted-foreground backdrop-blur-xl">
            <span>Built for premium SaaS demos</span>
            <span className="inline-flex items-center gap-1 text-foreground">Explore dashboard <ArrowUpRight className="size-3.5" /></span>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
          <motion.div
            className={cn("w-full max-w-md", busy && "pointer-events-none")}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: busy ? 0.985 : 1, filter: busy ? "blur(0.2px)" : "blur(0px)" }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-5" /></div>
              <div><p className="font-semibold">SmartQuote AI</p><p className="text-xs text-muted-foreground">Portfolio Edition</p></div>
            </div>
            <Card className={cn("relative overflow-hidden border-border/80 bg-card/75 shadow-2xl shadow-black/12 backdrop-blur-2xl", success && "ring-2 ring-emerald-500/25")}>
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--ring),transparent)]" />
              <CardHeader className="p-6 pb-3">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-3">{children}</CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
