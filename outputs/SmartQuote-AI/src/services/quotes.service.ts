import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/auth-helpers";
import { demoStore } from "@/services/demo-store";
import type { ListQuery, PaginatedResult, QuoteBuilderValue, QuoteTotals, QuoteWithClient, QuoteWithDetails } from "@/types";
import type { QuoteInsert, QuoteStatus } from "@/types/database";
import { calculateQuoteTotals } from "@/utils/calculations";
import { buildIlikeOrFilter } from "@/utils/supabase-filters";

const quoteSelect = "*, client:clients(id, company, contact_person, email, address)";
const quoteDetailsSelect = "*, client:clients(id, company, contact_person, email, address), quote_items(*, product:products(*))";

export const quotesService = {
  async list({ search = "", page = 1, pageSize = 10, archive = "active", status = "all" }: ListQuery = {}): Promise<PaginatedResult<QuoteWithClient>> {
    if (env.demoMode) return demoStore.quotes.list({ search, page, pageSize, archive, status });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase.from("quotes").select(quoteSelect, { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
    if (archive === "archived") query = query.not("archived_at", "is", null);
    if (archive === "active") query = query.is("archived_at", null);
    if (status !== "all") query = query.eq("status", status as QuoteStatus);
    const filter = buildIlikeOrFilter(["quote_number", "notes"], search);
    if (filter) query = query.or(filter);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as QuoteWithClient[], count: count ?? 0, page, pageSize };
  },
  async getById(id: string) {
    if (env.demoMode) return demoStore.quotes.getById(id);

    const { data, error } = await supabase.from("quotes").select(quoteDetailsSelect).eq("id", id).single();
    if (error) throw error;
    return data as QuoteWithDetails;
  },
  async saveDraft(value: QuoteBuilderValue) {
    if (env.demoMode) return demoStore.quotes.saveDraft(value);
    return this.upsert({ ...value, status: "draft" });
  },
  async approve(id: string) {
    if (env.demoMode) return demoStore.quotes.approve(id);
    return this.updateStatus(id, "accepted");
  },
  async reject(id: string) {
    if (env.demoMode) return demoStore.quotes.reject(id);
    return this.updateStatus(id, "rejected");
  },
  async duplicate(id: string) {
    if (env.demoMode) return demoStore.quotes.duplicate(id);

    const quote = await this.getById(id);
    return this.upsert({
      client_id: quote.client_id,
      status: "draft",
      notes: quote.notes ?? "",
      items: quote.quote_items.map((item) => ({
        id: crypto.randomUUID(),
        product_id: item.product_id,
        name: item.product?.name ?? "Product",
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        tax: item.tax,
        total: item.total,
      })),
    });
  },
  async updateStatus(id: string, status: QuoteStatus) {
    if (env.demoMode) return demoStore.quotes.updateStatus(id, status);

    const { data, error } = await supabase.from("quotes").update({ status }).eq("id", id).select(quoteSelect).single();
    if (error) throw error;
    return data as QuoteWithClient;
  },
  async upsert(value: QuoteBuilderValue) {
    if (env.demoMode) return demoStore.quotes.upsert(value);

    const owner_id = await getCurrentUserId();
    const totals: QuoteTotals = calculateQuoteTotals(value.items);
    const quotePayload: QuoteInsert = {
      owner_id,
      client_id: value.client_id,
      status: value.status,
      notes: value.notes || null,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      archived_at: null,
    };
    if (value.quote_number?.trim()) {
      quotePayload.quote_number = value.quote_number;
    }

    const { data: quote, error: quoteError } = value.id
      ? await supabase.from("quotes").update(quotePayload).eq("id", value.id).select("*").single()
      : await supabase.from("quotes").insert(quotePayload).select("*").single();
    if (quoteError) throw quoteError;

    const { error: deleteError } = await supabase.from("quote_items").delete().eq("quote_id", quote.id);
    if (deleteError) throw deleteError;

    if (value.items.length) {
      const { error: itemsError } = await supabase.from("quote_items").insert(
        value.items.map((item) => ({
          quote_id: quote.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          tax: item.tax,
          total: item.total,
        }))
      );
      if (itemsError) throw itemsError;
    }

    return this.getById(quote.id);
  },
  async archive(id: string) {
    if (env.demoMode) return demoStore.quotes.archive(id);

    const { data, error } = await supabase.from("quotes").update({ archived_at: new Date().toISOString() }).eq("id", id).select(quoteSelect).single();
    if (error) throw error;
    return data as QuoteWithClient;
  },
  async restore(id: string) {
    if (env.demoMode) return demoStore.quotes.restore(id);

    const { data, error } = await supabase.from("quotes").update({ archived_at: null }).eq("id", id).select(quoteSelect).single();
    if (error) throw error;
    return data as QuoteWithClient;
  },
  async remove(id: string) {
    if (env.demoMode) return demoStore.quotes.remove(id);

    const quote = await this.getById(id);
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) throw error;
    return quote;
  },
};
