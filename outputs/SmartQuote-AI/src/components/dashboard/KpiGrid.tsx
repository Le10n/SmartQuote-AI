import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MetricPill } from "@/components/shared/MetricPill";

interface KpiItem {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  detail: string;
}

function barsFor(index: number) {
  const patterns = [
    [42, 56, 48, 68, 76, 84],
    [32, 44, 62, 58, 70, 74],
    [38, 46, 52, 64, 72, 88],
    [58, 52, 64, 68, 78, 82],
  ];
  return patterns[index % patterns.length];
}

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((kpi, index) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.06, duration: 0.32, ease: "easeOut" }}
          whileHover={{ y: -3 }}
        >
          <Card className="group relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--chart-1),var(--chart-2))]" />
            <div className="absolute -right-8 -top-10 size-28 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ring)_18%,transparent),transparent_68%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <motion.p className="text-2xl font-semibold tracking-normal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.08 + 0.12 }}>{kpi.value}</motion.p>
                </div>
                <div className="flex items-center gap-2">
                  <MetricPill value={kpi.change} trend={kpi.trend} />
                  <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-foreground"><Sparkles className="size-3.5" /></span>
                </div>
              </div>
              <div className="mt-5 flex h-10 items-end gap-1.5" aria-hidden="true">
                {barsFor(index).map((height, barIndex) => (
                  <motion.span
                    key={barIndex}
                    className="flex-1 rounded-full bg-[linear-gradient(180deg,var(--chart-1),color-mix(in_oklab,var(--chart-2)_70%,var(--chart-1)))] opacity-75"
                    initial={{ height: 6, opacity: 0.35 }}
                    animate={{ height: height / 2, opacity: 0.75 }}
                    transition={{ delay: index * 0.05 + barIndex * 0.035, duration: 0.28, ease: "easeOut" }}
                  />
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">{kpi.detail}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
