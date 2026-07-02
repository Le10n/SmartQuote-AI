import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/auth-helpers";
import { demoStore } from "@/services/demo-store";
import type { ListQuery, PaginatedResult } from "@/types";
import type { ProductInsert, ProductRow, ProductUpdate } from "@/types/database";
import { buildIlikeOrFilter } from "@/utils/supabase-filters";

export const productsService = {
  async list({ search = "", page = 1, pageSize = 10, archive = "active", category }: ListQuery = {}): Promise<PaginatedResult<ProductRow>> {
    if (env.demoMode) return demoStore.products.list({ search, page, pageSize, archive, category });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase.from("products").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
    if (archive === "archived") query = query.not("archived_at", "is", null);
    if (archive === "active") query = query.is("archived_at", null);
    if (category && category !== "all") query = query.eq("category", category);
    const filter = buildIlikeOrFilter(["sku", "name", "category"], search);
    if (filter) query = query.or(filter);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0, page, pageSize };
  },
  async create(values: Omit<ProductInsert, "owner_id" | "archived_at" | "image_path"> & { image_path?: string | null }) {
    if (env.demoMode) return demoStore.products.create(values);

    const owner_id = await getCurrentUserId();
    const { data, error } = await supabase.from("products").insert({ ...values, owner_id, archived_at: null, image_path: values.image_path ?? null }).select("*").single();
    if (error) throw error;
    return data;
  },
  async update(id: string, values: ProductUpdate) {
    if (env.demoMode) return demoStore.products.update(id, values);

    const { data, error } = await supabase.from("products").update(values).eq("id", id).select("*").single();
    if (error) throw error;
    return data;
  },
  async archive(id: string) {
    if (env.demoMode) return demoStore.products.archive(id);
    return this.update(id, { archived_at: new Date().toISOString() });
  },
  async restore(id: string) {
    if (env.demoMode) return demoStore.products.restore(id);
    return this.update(id, { archived_at: null });
  },
  async remove(id: string) {
    if (env.demoMode) return demoStore.products.remove(id);

    const { data, error } = await supabase.from("products").delete().eq("id", id).select("*").single();
    if (error) throw error;
    return data;
  },
};
