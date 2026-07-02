import { assertSupabaseConfigured } from "@/lib/env";
import { supabase } from "@/lib/supabase";

export async function getCurrentUserId() {
  assertSupabaseConfigured();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be signed in to perform this action.");
  return data.user.id;
}
