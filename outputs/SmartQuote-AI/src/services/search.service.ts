import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { demoStore } from "@/services/demo-store";
import type { GlobalSearchResult } from "@/types";
import { buildIlikeOrFilter } from "@/utils/supabase-filters";

interface SearchClientRow { id: string; company: string; contact_person: string; email: string }
interface SearchProductRow { id: string; sku: string; name: string; category: string | null }
interface SearchQuoteRow { id: string; quote_number: string; status: string; total: number }

export const searchService = {
  async search(term: string): Promise<GlobalSearchResult[]> {
    if (env.demoMode) return demoStore.search(term);

    const value = term.trim();
    if (!value) return [];

    const clientFilter = buildIlikeOrFilter(["company", "contact_person", "email"], value);
    const productFilter = buildIlikeOrFilter(["sku", "name", "category"], value);
    const quoteFilter = buildIlikeOrFilter(["quote_number", "notes"], value);
    if (!clientFilter || !productFilter || !quoteFilter) return [];

    const [clients, products, quotes] = await Promise.all([
      supabase.from("clients").select("id, company, contact_person, email").is("archived_at", null).or(clientFilter).limit(5),
      supabase.from("products").select("id, sku, name, category").is("archived_at", null).or(productFilter).limit(5),
      supabase.from("quotes").select("id, quote_number, status, total").is("archived_at", null).or(quoteFilter).limit(5),
    ]);

    for (const response of [clients, products, quotes]) {
      if (response.error) throw response.error;
    }

    const clientRows = (clients.data ?? []) as SearchClientRow[];
    const productRows = (products.data ?? []) as SearchProductRow[];
    const quoteRows = (quotes.data ?? []) as SearchQuoteRow[];

    return [
      ...clientRows.map((client) => ({ id: client.id, type: "client" as const, title: client.company, subtitle: client.contact_person + " - " + client.email, href: "/clients" })),
      ...productRows.map((product) => ({ id: product.id, type: "product" as const, title: product.name, subtitle: product.sku + " - " + (product.category ?? "Uncategorized"), href: "/products" })),
      ...quoteRows.map((quote) => ({ id: quote.id, type: "quote" as const, title: quote.quote_number, subtitle: quote.status + " - " + quote.total, href: "/quotes" })),
    ];
  },
};
