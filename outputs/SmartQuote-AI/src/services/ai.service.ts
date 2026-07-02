import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { demoStore } from "@/services/demo-store";
import type { AiAction } from "@/types";

export const aiService = {
  async run(action: AiAction, input: string, context?: Record<string, unknown>) {
    if (env.demoMode) return demoStore.ai.run(action, input, context);

    const { data, error } = await supabase.functions.invoke<{ output: string }>("ai-assistant", {
      body: { action, input, context },
    });
    if (error) throw error;
    return data?.output ?? "";
  },
};
