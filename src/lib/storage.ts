import type { SupabaseClient } from "@supabase/supabase-js";
import { resizeImageToBlob } from "@/lib/image";

/**
 * Upload an image to Supabase Storage.
 * The file is resized client-side before upload.
 * Returns the storage path (not the full URL): `{storeId}/{uuid}.webp`
 */
export async function uploadImage(
  supabase: SupabaseClient,
  bucket: string,
  storeId: string,
  file: File,
  maxSize: number,
): Promise<string> {
  const blob = await resizeImageToBlob(file, maxSize);
  const path = `${storeId}/${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

/** Remove a file from Supabase Storage. */
export async function deleteImage(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/** Get the full public URL for a storage path. */
export function getPublicUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Detect whether a value is a legacy base64 data URL (old format). */
export function isBase64Image(src: string): boolean {
  return src.startsWith("data:image/");
}

/**
 * Given an image value from the database, return a displayable URL.
 * - base64 data URLs are returned as-is (legacy).
 * - Storage paths are expanded to full public URLs.
 */
export function resolveImageUrl(
  supabaseUrl: string,
  bucket: string,
  value: string,
): string {
  if (!value) return "";
  if (isBase64Image(value)) return value;
  // If it's already a full URL, return as-is
  if (value.startsWith("http")) return value;
  // It's a storage path — build the public URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${value}`;
}
