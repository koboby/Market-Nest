import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImageUnder100KB, MAX_IMAGE_BYTES } from "./compress-image";

const BUCKET = "store-media";

export async function uploadStoreImage(
  supabase: SupabaseClient,
  storeId: string,
  originalFile: File,
): Promise<{ path: string; url: string; size: number }> {
  if (!storeId) throw new Error("Choose a store before uploading an image.");

  const compressed = await compressImageUnder100KB(originalFile);
  if (compressed.size >= MAX_IMAGE_BYTES) {
    throw new Error("Upload blocked: images must be smaller than 100 KB.");
  }

  const path = `${storeId}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl, size: compressed.size };
}
