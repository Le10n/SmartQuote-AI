import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/auth-helpers";
import { demoStore } from "@/services/demo-store";
import type { CompanySettingsRow, CompanySettingsUpdate } from "@/types/database";

export const settingsService = {
  async get(): Promise<CompanySettingsRow> {
    if (env.demoMode) return demoStore.settings.get();

    const owner_id = await getCurrentUserId();
    const { data, error } = await supabase.from("company_settings").select("*").eq("owner_id", owner_id).maybeSingle();
    if (error) throw error;
    if (data) return data;
    const { data: created, error: createError } = await supabase.from("company_settings").insert({ owner_id }).select("*").single();
    if (createError) throw createError;
    return created;
  },
  async update(values: CompanySettingsUpdate): Promise<CompanySettingsRow> {
    if (env.demoMode) return demoStore.settings.update(values);

    const owner_id = await getCurrentUserId();
    const { data, error } = await supabase.from("company_settings").update(values).eq("owner_id", owner_id).select("*").single();
    if (error) throw error;
    return data;
  },
};
