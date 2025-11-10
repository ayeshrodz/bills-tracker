import { supabase } from "../lib/supabaseClient";
import { requireSession } from "../lib/withSessionCheck";
import type {
  AttachmentCategory,
  BillAttachment,
} from "../types/attachments";
import { buildAttachmentPath } from "../utils/storagePaths";
import { appConfig } from "../config";

export const listAttachments = async (
  billId: string
): Promise<BillAttachment[]> => {
  const { data, error } = await supabase
    .from("bill_attachments")
    .select("*")
    .eq("bill_id", billId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return data as BillAttachment[];
};

export const uploadAttachment = async (
  billId: string,
  file: File,
  fileType: AttachmentCategory = "other"
): Promise<BillAttachment> => {
  await requireSession();
  const path = buildAttachmentPath(billId, file.name);

  const { data: storageData, error: storageError } = await supabase.storage
    .from(appConfig.supabase.bucket)
    .upload(path, file);

  if (storageError) throw storageError;

  const storagePath = storageData?.path ?? path;

  const { data, error: dbError } = await supabase
    .from("bill_attachments")
    .insert({
      bill_id: billId,
      file_type: fileType,
      file_name: file.name,
      file_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return data as BillAttachment;
};

export const deleteAttachmentRecord = async (id: string): Promise<void> => {
  await requireSession();
  const { error } = await supabase
    .from("bill_attachments")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const deleteAttachmentFile = async (path: string): Promise<void> => {
  await requireSession();
  const { error } = await supabase.storage
    .from(appConfig.supabase.bucket)
    .remove([path]);
  if (error) throw error;
};

export const createSignedUrl = async (path: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(appConfig.supabase.bucket)
    .createSignedUrl(path, appConfig.supabase.signedUrlTTL);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Unable to generate signed URL");
  }

  return data.signedUrl;
};
