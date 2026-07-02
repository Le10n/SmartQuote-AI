import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QuoteWithClient } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";

export function RecentQuotesTable({ quotes }: { quotes: QuoteWithClient[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Recent quotes</CardTitle><CardDescription>Latest quote activity across the pipeline.</CardDescription></div><Button variant="outline" size="sm" asChild><Link to="/quotes">View all<ArrowUpRight className="size-4" /></Link></Button></CardHeader>
      <CardContent>
        {quotes.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Quote</TableHead><TableHead>Client</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Value</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
            <TableBody>{quotes.map((quote) => <TableRow key={quote.id}><TableCell className="font-medium">{quote.quote_number}</TableCell><TableCell><p className="font-medium">{quote.client?.contact_person ?? "Client"}</p><p className="text-xs text-muted-foreground">{quote.client?.company ?? "Unknown"}</p></TableCell><TableCell><StatusBadge status={quote.status} /></TableCell><TableCell className="text-right font-medium">{formatCurrency(quote.total)}</TableCell><TableCell className="text-muted-foreground">{formatDate(quote.created_at)}</TableCell></TableRow>)}</TableBody>
          </Table>
        ) : <EmptyState icon={ArrowUpRight} title="No recent quotes" description="Create your first quote to see activity here." />}
      </CardContent>
    </Card>
  );
}
