import { motion } from "framer-motion";
import { ArrowUpRight, Lightbulb, Sparkles, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/types";
import { formatCurrency } from "@/utils/formatters";

interface AiInsightsProps {
  data: DashboardSummary;
}

export function AiInsights({ data }: AiInsightsProps) {
  const pipelineValue = data.recentQuotes.reduce((sum, quote) => sum + quote.total, 0);
  const topClient = data.topClients[0];
  const topProduct = data.topProducts[0];
  const acceptanceBase = data.acceptedQuotes + data.rejectedQuotes;
  const winRate = acceptanceBase ? Math.round((data.acceptedQuotes / acceptanceBase) * 100) : 0;

  const insights = [
    {
      icon: Target,
      label: "Pipeline focus",
      value: data.pendingQuotes ? data.pendingQuotes + " quotes need attention" : "Pipeline is clear",
      detail: data.pendingQuotes ? "AI recommends prioritizing the highest-value pending quotes before creating new drafts." : "Use AI suggestions to create the next quote with a stronger opening proposal.",
    },
    {
      icon: Lightbulb,
      label: "Smart pricing",
      value: topProduct ? topProduct.name : "Catalog ready",
      detail: topProduct ? "Top product has " + formatCurrency(topProduct.revenue) + " attributed revenue. Consider protecting margin on similar bundles." : "Add accepted quotes to unlock product-level margin recommendations.",
    },
    {
      icon: Zap,
      label: "Client momentum",
      value: topClient ? topClient.company : "No top client yet",
      detail: topClient ? topClient.quotes + " accepted quotes tracked. Generate a follow-up while the relationship is warm." : "Create a client and quote to let SmartQuote AI identify buying patterns.",
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card className="relative overflow-hidden bg-[linear-gradient(135deg,color-mix(in_oklab,var(--accent)_18%,transparent),var(--card)_62%)]">
        <div className="absolute -right-12 -top-16 size-48 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ring)_22%,transparent),transparent_68%)]" />
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></div>
            <div>
              <CardTitle>Today’s command brief</CardTitle>
              <CardDescription>AI-readiness snapshot for quote work.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-background/55 p-3 backdrop-blur">
            <p className="text-xs text-muted-foreground">Pipeline value</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(pipelineValue)}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/55 p-3 backdrop-blur">
            <p className="text-xs text-muted-foreground">Win rate</p>
            <p className="mt-1 text-lg font-semibold">{winRate}%</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/55 p-3 backdrop-blur">
            <p className="text-xs text-muted-foreground">Avg. quote</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(data.averageQuoteValue)}</p>
          </div>
          <div className="sm:col-span-3 rounded-lg border border-border/70 bg-background/55 p-3 text-sm leading-6 text-muted-foreground backdrop-blur">
            SmartQuote AI would focus on {data.pendingQuotes ? "follow-ups, pricing confidence, and pending approvals" : "creating one high-quality quote with a strong executive summary"} today.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>AI recommendations</CardTitle>
            <CardDescription>Small next-best actions generated from live workspace data.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild><Link to="/quotes">Act on quote<ArrowUpRight className="size-4" /></Link></Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.label}
                className="group rounded-lg border border-border/70 bg-secondary/25 p-3 transition-all hover:border-ring/40 hover:bg-secondary/45 hover:shadow-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.22 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-sm transition-transform group-hover:scale-105"><Icon className="size-4" /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{insight.label}</p>
                    <p className="mt-1 text-sm font-semibold">{insight.value}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{insight.detail}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
