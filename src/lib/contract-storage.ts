// Helpers to upload/retrieve contract PDFs from the private "contract-files" bucket.
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "contract-files";

export async function uploadContractFile(contractId: string, file: File): Promise<{ path: string } | null> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${contractId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) {
    console.error("[contract-storage] upload", error);
    return null;
  }
  return { path };
}

export async function getContractFileUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error) {
    console.error("[contract-storage] signed url", error);
    return null;
  }
  return data.signedUrl;
}

export async function deleteContractFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("[contract-storage] delete", error);
}
