import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AiInsights } from "@/components/dashboard/AiInsights";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { RecentClients } from "@/components/dashboard/RecentClients";
import { RecentQuotesTable } from "@/components/dashboard/RecentQuotesTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageShell } from "@/components/shared/PageShell";
import { DashboardSkeleton } from "@/components/shared/Skeleton";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import { dashboardService } from "@/services/dashboard.service";
import { formatCurrency } from "@/utils/formatters";

export function Dashboard() {
  const summary = useAsync(() => dashboardService.getSummary(), []);
  const data = summary.data;
  const kpis = data ? [
    { label: "Revenue", value: formatCurrency(data.revenue), change: "+0%", trend: "up" as const, detail: "Accepted quote revenue" },
    { label: "Pending quotes", value: String(data.pendingQuotes), change: "+0%", trend: "up" as const, detail: "Draft and pending quotes" },
    { label: "Accepted quotes", value: String(data.acceptedQuotes), change: "+0%", trend: "up" as const, detail: "Won commercial quotes" },
    { label: "Average quote", value: formatCurrency(data.averageQuoteValue), change: "+0%", trend: "up" as const, detail: "Across active quote pipeline" },
  ] : [];

  return (
    <PageShell
      title="Dashboard"
      description="A real-time command center for quote velocity, client activity, revenue performance, and AI pricing guidance."
      actions={<Button variant="premium" size="sm" asChild><Link to="/quotes"><Plus className="size-4" />New quote</Link></Button>}
    >
      {summary.loading ? <DashboardSkeleton /> : null}
      {!summary.loading && !data ? <EmptyState icon={Plus} title="No dashboard data" description="Create clients, products, and quotes to populate analytics." /> : null}
      {data ? (
        <>
          <div data-tour="dashboard-kpis"><KpiGrid items={kpis} /></div>
          <AiInsights data={data} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]"><RevenueChart data={data.monthlyRevenue} /><RecentClients clients={data.recentClients} /></div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]"><RecentQuotesTable quotes={data.recentQuotes} /><ActivityFeed activity={data.latestActivity} /></div>
        </>
      ) : null}
    </PageShell>
  );
}
