import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/auth-helpers";
import { demoStore } from "@/services/demo-store";
import type { ListQuery, PaginatedResult } from "@/types";
import type { ClientInsert, ClientRow, ClientUpdate } from "@/types/database";
import { buildIlikeOrFilter } from "@/utils/supabase-filters";

export const clientsService = {
  async list({ search = "", page = 1, pageSize = 10, archive = "active" }: ListQuery = {}): Promise<PaginatedResult<ClientRow>> {
    if (env.demoMode) return demoStore.clients.list({ search, page, pageSize, archive });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase.from("clients").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
    if (archive === "archived") query = query.not("archived_at", "is", null);
    if (archive === "active") query = query.is("archived_at", null);
    const filter = buildIlikeOrFilter(["company", "contact_person", "email"], search);
    if (filter) query = query.or(filter);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0, page, pageSize };
  },
  async create(values: Omit<ClientInsert, "owner_id" | "archived_at">) {
    if (env.demoMode) return demoStore.clients.create(values);

    const owner_id = await getCurrentUserId();
    const { data, error } = await supabase.from("clients").insert({ ...values, owner_id, archived_at: null }).select("*").single();
    if (error) throw error;
    return data;
  },
  async update(id: string, values: ClientUpdate) {
    if (env.demoMode) return demoStore.clients.update(id, values);

    const { data, error } = await supabase.from("clients").update(values).eq("id", id).select("*").single();
    if (error) throw error;
    return data;
  },
  async archive(id: string) {
    if (env.demoMode) return demoStore.clients.archive(id);
    return this.update(id, { archived_at: new Date().toISOString() });
  },
  async restore(id: string) {
    if (env.demoMode) return demoStore.clients.restore(id);
    return this.update(id, { archived_at: null });
  },
  async remove(id: string) {
    if (env.demoMode) return demoStore.clients.remove(id);

    const { data, error } = await supabase.from("clients").delete().eq("id", id).select("*").single();
    if (error) throw error;
    return data;
  },
};
