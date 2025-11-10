// src/hooks/useBillAttachments.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { BillAttachment, AttachmentCategory } from "../types/attachments";
import { buildAttachmentPath } from "../utils/storagePaths";

const BUCKET = "bill-attachments";

type UseBillAttachmentsResult = {
  attachments: BillAttachment[];
  loading: boolean;
  error: string | null;
  uploadFiles: (
    files: FileList | File[],
    fileType?: AttachmentCategory
  ) => Promise<void>;
  deleteAttachment: (att: BillAttachment) => Promise<void>;
  getSignedUrl: (path: string) => Promise<string | null>;
  refetch: () => Promise<void>;
};

export function useBillAttachments(
  billId: string | null
): UseBillAttachmentsResult {
  const [attachments, setAttachments] = useState<BillAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setUnknownError = (err: unknown) => {
    if (err instanceof Error) setError(err.message);
    else if (typeof err === "string") setError(err);
    else setError("Unknown error");
  };

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
    fileType: AttachmentCategory = "other"
  ): Promise<void> {
    if (!billId) return;

    const fileArray = Array.from(files);
    setError(null);
    setLoading(true);

    try {
      for (const file of fileArray) {
        const path = buildAttachmentPath(billId, file.name);

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

        // 2) Insert DB row
        const { data, error: dbError } = await supabase
          .from("bill_attachments")
          .insert({
            bill_id: billId,
            file_type: fileType,
            file_name: file.name,      // original name for display
            file_path: storagePath,    // sanitized path used in storage
            mime_type: file.type || null,
            size_bytes: file.size,
            // user_id is set by RLS / DB default (auth.uid())
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
    } catch (err) {
      console.error("Unexpected error uploading attachments:", err);
      setUnknownError(err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAttachment(att: BillAttachment): Promise<void> {
    setError(null);
    setLoading(true);

    try {
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
    } catch (err) {
      console.error("Unexpected error deleting attachment:", err);
      setUnknownError(err);
    } finally {
      setLoading(false);
    }
  }

  async function getSignedUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60); // 60 seconds expiry

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }
    return data.signedUrl;
  }

  return {
    attachments,
    loading,
    error,
    uploadFiles,
    deleteAttachment,
    getSignedUrl,
    refetch: fetchAttachments,
  };
}
