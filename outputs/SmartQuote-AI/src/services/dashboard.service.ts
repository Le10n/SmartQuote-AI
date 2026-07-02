import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { demoStore } from "@/services/demo-store";
import type { DashboardSummary, QuoteWithClient } from "@/types";
import type { ProductRow, QuoteItemRow } from "@/types/database";

function monthKey(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(date));
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    if (env.demoMode) return demoStore.dashboard.getSummary();

    const [quotesRes, clientsRes, itemsRes, activityRes] = await Promise.all([
      supabase.from("quotes").select("*, client:clients(id, company, contact_person, email, address)").is("archived_at", null).order("created_at", { ascending: false }),
      supabase.from("clients").select("*").is("archived_at", null).order("created_at", { ascending: false }).limit(8),
      supabase.from("quote_items").select("*, product:products(*)"),
      supabase.from("activity_events").select("*").order("created_at", { ascending: false }).limit(8),
    ]);

    for (const response of [quotesRes, clientsRes, itemsRes, activityRes]) {
      if (response.error) throw response.error;
    }

    const quotes = (quotesRes.data ?? []) as QuoteWithClient[];
    const clients = clientsRes.data ?? [];
    const items = (itemsRes.data ?? []) as Array<QuoteItemRow & { product: ProductRow | null }>;
    const accepted = quotes.filter((quote) => quote.status === "accepted");
    const revenue = accepted.reduce((sum, quote) => sum + quote.total, 0);

    const monthlyMap = new Map<string, { month: string; revenue: number; quotes: number }>();
    for (const quote of accepted) {
      const key = monthKey(quote.created_at);
      const current = monthlyMap.get(key) ?? { month: key, revenue: 0, quotes: 0 };
      current.revenue += quote.total;
      current.quotes += 1;
      monthlyMap.set(key, current);
    }

    const clientMap = new Map<string, { id: string; company: string; contact_person: string; revenue: number; quotes: number }>();
    for (const quote of accepted) {
      if (!quote.client) continue;
      const current = clientMap.get(quote.client.id) ?? { id: quote.client.id, company: quote.client.company, contact_person: quote.client.contact_person, revenue: 0, quotes: 0 };
      current.revenue += quote.total;
      current.quotes += 1;
      clientMap.set(quote.client.id, current);
    }

    const productMap = new Map<string, { id: string; name: string; sku: string; revenue: number; quantity: number }>();
    for (const item of items) {
      if (!item.product) continue;
      const current = productMap.get(item.product.id) ?? { id: item.product.id, name: item.product.name, sku: item.product.sku, revenue: 0, quantity: 0 };
      current.revenue += item.total;
      current.quantity += item.quantity;
      productMap.set(item.product.id, current);
    }

    return {
      revenue,
      monthlyRevenue: Array.from(monthlyMap.values()),
      pendingQuotes: quotes.filter((quote) => quote.status === "pending" || quote.status === "draft").length,
      acceptedQuotes: accepted.length,
      rejectedQuotes: quotes.filter((quote) => quote.status === "rejected").length,
      averageQuoteValue: quotes.length ? quotes.reduce((sum, quote) => sum + quote.total, 0) / quotes.length : 0,
      topClients: Array.from(clientMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      topProducts: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      latestActivity: activityRes.data ?? [],
      recentQuotes: quotes.slice(0, 5),
      recentClients: clients,
    };
  },
};
