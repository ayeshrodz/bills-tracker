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
  getSignedUrl: (filePath: string) => Promise<string | null>;
};

export const useBillAttachments = (billId: string): UseBillAttachmentsResult => {
  const [attachments, setAttachments] = useState<BillAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeError = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return "Unknown error";
    }
  };

  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("bill_attachments")
        .select("*")
        .eq("bill_id", billId)
        .order("uploaded_at", { ascending: false });

      if (queryError) throw queryError;

      setAttachments(data || []);
    } catch (err: unknown) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    if (!billId) return;
    void fetchAttachments();
  }, [billId, fetchAttachments]);

  const uploadFiles = useCallback(
    async (
      files: FileList | File[],
      fileType: "bill" | "payment" | "other" = "other"
    ) => {
      setLoading(true);
      setError(null);

      try {
        for (const file of Array.from(files)) {
          const filePath = `${billId}/${Date.now()}_${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: insertError } = await supabase
            .from("bill_attachments")
            .insert({
              bill_id: billId,
              file_type: fileType,
              file_name: file.name,
              file_path: filePath,
              mime_type: file.type,
              size_bytes: file.size,
            });

          if (insertError) throw insertError;
        }

        await fetchAttachments();
      } catch (err: unknown) {
        setError(normalizeError(err));
      } finally {
        setLoading(false);
      }
    },
    [billId, fetchAttachments]
  );

  const deleteAttachment = useCallback(
    async (att: BillAttachment) => {
      setError(null);
      try {
        // Delete from storage
        await supabase.storage.from(BUCKET).remove([att.file_path]);

        // Delete record
        const { error: delError } = await supabase
          .from("bill_attachments")
          .delete()
          .eq("id", att.id);

        if (delError) throw delError;

        setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      } catch (err: unknown) {
        setError(normalizeError(err));
      }
    },
    []
  );

  const getSignedUrl = useCallback(
    async (filePath: string): Promise<string | null> => {
      if (!filePath) return null;

      const { data, error: signedError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

      if (signedError) {
        // Avoid "Object not found" showing up after deletion
        if (signedError.message === "Object not found") {
          console.warn("File not found when creating signed URL:", filePath);
          return null;
        }

        console.error("Error creating signed URL:", signedError.message);
        setError(signedError.message);
        return null;
      }

      return data?.signedUrl ?? null;
    },
    []
  );

  // Clear stale error when no attachments
  useEffect(() => {
    if (attachments.length === 0) {
      setError(null);
    }
  }, [attachments]);

  return {
    attachments,
    loading,
    error,
    uploadFiles,
    deleteAttachment,
    getSignedUrl,
  };
};
