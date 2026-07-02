import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/utils/formatters";
import { BarChart3 } from "lucide-react";

interface RevenuePoint { month: string; revenue: number; quotes: number }

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const total = data.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <Card className="chart-card-gradient min-h-[420px] overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><CardTitle>Revenue performance</CardTitle><CardDescription>Accepted quote revenue by month.</CardDescription></div>
        <motion.div className="rounded-lg border border-border bg-background/70 px-3 py-2 text-right shadow-sm" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}><p className="text-xs text-muted-foreground">Current revenue</p><p className="text-sm font-semibold">{formatCurrency(total)}</p></motion.div>
      </CardHeader>
      <CardContent className="h-[310px]">
        {data.length ? (
          <motion.div className="h-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 4, right: 10, top: 10, bottom: 0 }}>
                <defs><linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.34} /><stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(value) => formatCompactCurrency(Number(value))} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ stroke: "var(--ring)", strokeWidth: 1 }} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)", boxShadow: "0 18px 40px rgba(0,0,0,0.16)" }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" fill="url(#revenueFill)" strokeWidth={3} isAnimationActive animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <EmptyState icon={BarChart3} title="No revenue yet" description="Accepted quotes will populate this performance chart automatically." />
        )}
      </CardContent>
    </Card>
  );
}
