import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/auth-helpers";

export type StorageBucket = "company-assets" | "client-files" | "product-images" | "quote-attachments";

function extension(file: File) {
  const found = file.name.split(".").pop();
  return found ? "." + found.toLowerCase() : "";
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("File could not be read."));
    reader.readAsDataURL(file);
  });
}

export const storageService = {
  async upload(bucket: StorageBucket, file: File, folder = "uploads") {
    if (env.demoMode) {
      return fileToDataUrl(file);
    }

    const ownerId = await getCurrentUserId();
    const filePath = ownerId + "/" + folder + "/" + crypto.randomUUID() + extension(file);
    const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: false, cacheControl: "3600" });
    if (error) throw error;
    return filePath;
  },
  getPublicUrl(bucket: StorageBucket, path: string | null) {
    if (!path) return null;
    if (env.demoMode && path.startsWith("data:")) return path;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
  async createSignedUrl(bucket: StorageBucket, path: string, expiresIn = 3600) {
    if (env.demoMode && path.startsWith("data:")) return path;

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },
};
