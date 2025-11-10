// src/hooks/useBillAttachments.ts
import { useCallback, useEffect, useState } from "react";
import type { BillAttachment, AttachmentCategory } from "../types/attachments";
import { attachmentsService } from "../services";
import { normalizeError } from "../utils/errors";

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

  const fetchAttachments = useCallback(async () => {
    if (!billId) {
      setAttachments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await attachmentsService.listAttachments(billId);
      setAttachments(data);
    } catch (err) {
      console.error("Error loading attachments:", err);
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    void fetchAttachments();
  }, [fetchAttachments]);

  const uploadFiles = useCallback(
    async (
      files: FileList | File[],
      fileType: AttachmentCategory = "other"
    ): Promise<void> => {
      if (!billId) return;

      const fileArray = Array.from(files);
      setError(null);
      setLoading(true);

    try {
      const errors: string[] = [];
      for (const file of fileArray) {
        try {
          const created = await attachmentsService.uploadAttachment(
            billId,
            file,
            fileType
          );
          setAttachments((prev) => [created, ...prev]);
        } catch (err) {
          const message = normalizeError(err);
          errors.push(message);
          setError(message);
        }
      }

      if (errors.length) {
        throw new Error(errors.join(", "));
      }
    } catch (err) {
      console.error("Unexpected error uploading attachments:", err);
      setError(normalizeError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  },
  [billId]
  );

  const deleteAttachment = useCallback(
    async (att: BillAttachment): Promise<void> => {
      setError(null);
      setLoading(true);

      try {
        await attachmentsService.deleteAttachmentFile(att.file_path);
        await attachmentsService.deleteAttachmentRecord(att.id);
        setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      } catch (err) {
        console.error("Unexpected error deleting attachment:", err);
        setError(normalizeError(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    try {
      return await attachmentsService.createSignedUrl(path);
    } catch (err) {
      console.error("Error creating signed URL:", err);
      return null;
    }
  }, []);

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
