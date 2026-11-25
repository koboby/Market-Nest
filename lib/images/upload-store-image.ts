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
  if (compressed.size >= MAX_IMAGE_BYTES) throw new Error("Upload blocked: images must be smaller than 100 KB.");

  const path = `${storeId}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: "image/webp", cacheControl: "31536000", upsert: false,
  });
  if (error) throw new Error(error.message);

  // The bucket is private; use a short-lived signed URL for previews.
  const { data, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (signedError) throw new Error(signedError.message);
  return { path, url: data.signedUrl, size: compressed.size };
}
