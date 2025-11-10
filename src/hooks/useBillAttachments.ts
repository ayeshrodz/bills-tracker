// src/hooks/useBillAttachments.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type BillAttachment = {
  id: string;
  bill_id: string;
  file_type: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_at: string;
  // user_id exists in DB but we don't need it in the UI right now
  user_id?: string | null;
};

const BUCKET = "bill-attachments";

type UseBillAttachmentsResult = {
  attachments: BillAttachment[];
  loading: boolean;
  error: string | null;
  uploadFiles: (
    files: FileList | File[],
    fileType?: "bill" | "payment" | "other"
  ) => Promise<void>;
  deleteAttachment: (att: BillAttachment) => Promise<void>;
  getPublicUrl: (path: string) => string;
  refetch: () => Promise<void>;
};

export function useBillAttachments(billId: string | null): UseBillAttachmentsResult {
  const [attachments, setAttachments] = useState<BillAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttachments = useCallback(async () => {
    if (!billId) {
      setAttachments([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("bill_attachments")
      .select("*")
      .eq("bill_id", billId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error loading attachments:", error);
      setError(error.message);
    } else if (data) {
      setAttachments(data as BillAttachment[]);
    }

    setLoading(false);
  }, [billId]);

  useEffect(() => {
    void fetchAttachments();
  }, [fetchAttachments]);

  async function uploadFiles(
    files: FileList | File[],
    fileType: "bill" | "payment" | "other" = "other"
  ): Promise<void> {
    if (!billId) return;

    const fileArray = Array.from(files);
    setError(null);

    for (const file of fileArray) {
      // Build a unique storage path per bill
      const ext = file.name.split(".").pop() || "";
      const path = `${billId}/${crypto.randomUUID()}.${ext}`;

      // 1) Upload to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (storageError) {
        console.error("Error uploading file to storage:", storageError);
        setError(storageError.message);
        continue;
      }

      const storagePath = storageData?.path ?? path;

      // 2) Insert DB row (RLS will attach user_id = auth.uid())
      const { data, error: dbError } = await supabase
        .from("bill_attachments")
        .insert({
          bill_id: billId,
          file_type: fileType,
          file_name: file.name,
          file_path: storagePath,
          mime_type: file.type || null,
          size_bytes: file.size,
          // do NOT send user_id; DB default auth.uid() handles it
        })
        .select()
        .single();

      if (dbError) {
        console.error("Error inserting attachment row:", dbError);
        setError(dbError.message);
        continue;
      }

      if (data) {
        setAttachments((prev) => [data as BillAttachment, ...prev]);
      }
    }
  }

  async function deleteAttachment(att: BillAttachment): Promise<void> {
    setError(null);

    // 1) Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([att.file_path]);

    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
      setError(storageError.message);
      return;
    }

    // 2) Delete DB row
    const { error: dbError } = await supabase
      .from("bill_attachments")
      .delete()
      .eq("id", att.id);

    if (dbError) {
      console.error("Error deleting attachment row:", dbError);
      setError(dbError.message);
      return;
    }

    setAttachments((prev) => prev.filter((a) => a.id !== att.id));
  }

  function getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  return {
    attachments,
    loading,
    error,
    uploadFiles,
    deleteAttachment,
    getPublicUrl,
    refetch: fetchAttachments,
  };
}
