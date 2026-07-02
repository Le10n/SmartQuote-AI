import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageShell } from "@/components/shared/PageShell";
import { ChartSkeleton } from "@/components/shared/Skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { dashboardService } from "@/services/dashboard.service";
import { formatCompactCurrency, formatCurrency } from "@/utils/formatters";

export function Analytics() {
  const summary = useAsync(() => dashboardService.getSummary(), []);
  const data = summary.data;
  const funnel = data ? [
    { stage: "Pending", count: data.pendingQuotes },
    { stage: "Accepted", count: data.acceptedQuotes },
    { stage: "Rejected", count: data.rejectedQuotes },
  ] : [];
  const clientSegments = data?.topClients.map((client, index) => ({ name: client.company, value: client.revenue, fill: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"][index % 5] })) ?? [];
  const conversionBase = data ? data.acceptedQuotes + data.rejectedQuotes : 0;
  const conversionRate = conversionBase && data ? Math.round((data.acceptedQuotes / conversionBase) * 100) : 0;

  return (
    <PageShell title="Analytics" description="Measure conversion, client concentration, product performance, and monthly revenue from live quote data.">
      {summary.loading ? <ChartSkeleton /> : null}
      {data ? (
        <>
          <Card className="relative overflow-hidden bg-[linear-gradient(135deg,color-mix(in_oklab,var(--accent)_18%,transparent),var(--card)_62%)]">
            <div className="absolute -right-10 -top-16 size-44 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ring)_20%,transparent),transparent_68%)]" />
            <CardContent className="relative grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Brain className="size-4" /></div>
                <div>
                  <p className="text-sm font-semibold">AI analytics brief</p>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">SmartQuote AI sees a {conversionRate}% measured win rate and {formatCurrency(data.revenue)} accepted revenue. Focus on high-value pending quotes and repeat the patterns from top-performing clients.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-80">
                {[{ label: "Win rate", value: conversionRate + "%", icon: TrendingUp }, { label: "Pending", value: String(data.pendingQuotes), icon: Sparkles }, { label: "Avg quote", value: formatCompactCurrency(data.averageQuoteValue), icon: Brain }].map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <motion.div key={metric.label} className="rounded-lg border border-border/70 bg-background/55 p-3 shadow-sm backdrop-blur" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.22 }}>
                      <Icon className="size-4 text-muted-foreground" />
                      <p className="mt-2 text-xs text-muted-foreground">{metric.label}</p>
                      <p className="text-sm font-semibold">{metric.value}</p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <Card className="min-h-[390px]">
              <CardHeader><CardTitle>Quote conversion funnel</CardTitle><CardDescription>Current active quote status mix.</CardDescription></CardHeader>
              <CardContent className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={funnel} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><Tooltip cursor={{ fill: "var(--secondary)" }} /><Bar dataKey="count" radius={[8, 8, 0, 0]} fill="var(--chart-1)" /></BarChart></ResponsiveContainer></CardContent>
            </Card>

            <Card className="min-h-[390px]">
              <CardHeader><CardTitle>Top client mix</CardTitle><CardDescription>Accepted quote revenue by client.</CardDescription></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_220px] xl:grid-cols-1 2xl:grid-cols-[1fr_220px]">
                <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={clientSegments} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>{clientSegments.map((segment) => <Cell key={segment.name} fill={segment.fill} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))} /></PieChart></ResponsiveContainer></div>
                <div className="space-y-3">{clientSegments.map((segment) => <div key={segment.name} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 p-3"><div className="flex min-w-0 items-center gap-2"><span className="size-2 shrink-0 rounded-full" style={{ background: segment.fill }} /><span className="truncate text-sm font-medium">{segment.name}</span></div><span className="text-sm text-muted-foreground">{formatCompactCurrency(segment.value)}</span></div>)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <Card>
              <CardHeader><CardTitle>Monthly revenue</CardTitle><CardDescription>Accepted quote revenue by month.</CardDescription></CardHeader>
              <CardContent className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.monthlyRevenue} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(value) => formatCompactCurrency(Number(value))} /><Tooltip cursor={{ fill: "var(--secondary)" }} formatter={(value) => formatCurrency(Number(value))} /><Bar dataKey="revenue" fill="var(--chart-1)" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top products</CardTitle><CardDescription>Revenue generated by quoted products.</CardDescription></CardHeader>
              <CardContent className="space-y-3">{data.topProducts.map((product) => <div key={product.id} className="rounded-lg border border-border bg-secondary/30 p-3"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-medium">{product.name}</p><span className="text-sm font-semibold">{formatCompactCurrency(product.revenue)}</span></div><p className="mt-1 text-xs text-muted-foreground">{product.sku} - {product.quantity} units quoted</p></div>)}</CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
