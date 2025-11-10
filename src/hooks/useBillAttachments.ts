// src/hooks/useBillAttachments.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { BillAttachment, AttachmentCategory } from "../types/attachments";
import { attachmentsService } from "../services";
import { normalizeError } from "../utils/errors";
import { SessionExpiredError } from "../lib/errors";
import { useAuth } from "./useAuth";
import { appConfig } from "../config";

type UseBillAttachmentsResult = {
  attachments: BillAttachment[];
  signedUrls: Record<string, string | null>;
  loading: boolean;
  error: string | null;
  uploadFiles: (
    files: FileList | File[],
    fileType?: AttachmentCategory
  ) => Promise<void>;
  deleteAttachment: (att: BillAttachment) => Promise<void>;
  refetch: () => Promise<void>;
};

export function useBillAttachments(
  billId: string | null
): UseBillAttachmentsResult {
  const [attachments, setAttachments] = useState<BillAttachment[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string | null>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();
  const signedUrlCache = useRef<
    Record<string, { url: string | null; expiresAt: number }>
  >({});

  const handleSessionExpired = useCallback(
    (err?: SessionExpiredError) => {
      void signOut();
      return err?.message ?? "Session expired. Please sign in again.";
    },
    [signOut]
  );

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
      if (err instanceof SessionExpiredError) {
        setError(handleSessionExpired(err));
      } else {
        setError(normalizeError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [billId, handleSessionExpired]);

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
        const results = await Promise.allSettled(
          fileArray.map(async (file) => {
            if (file.size > 10 * 1024 * 1024) {
              throw new Error(
                `${file.name} is larger than 10MB. Please upload a smaller file.`
              );
            }
            const created = await attachmentsService.uploadAttachment(
              billId,
              file,
              fileType
            );
            setAttachments((prev) => [created, ...prev]);
          })
        );

        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length) {
          const messages = failures.map((failure) =>
            failure.status === "rejected"
              ? normalizeError(failure.reason)
              : ""
          );
          throw new Error(messages.join(", "));
        }
      } catch (err) {
        if (err instanceof SessionExpiredError) {
          const message = handleSessionExpired(err);
          setError(message);
          throw new SessionExpiredError(message);
        }
        const message = normalizeError(err);
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [billId, handleSessionExpired]
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
        if (err instanceof SessionExpiredError) {
          const message = handleSessionExpired(err);
          throw new SessionExpiredError(message);
        }
        setError(normalizeError(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleSessionExpired]
  );

  const refreshSignedUrls = useCallback(async () => {
    if (!attachments.length) {
      setSignedUrls({});
      return;
    }

    const now = Date.now();
    const ttlBufferMs = 5_000;
    const missing = attachments
      .map((att) => att.file_path)
      .filter((path) => {
        const cached = signedUrlCache.current[path];
        return !cached || cached.expiresAt <= now + ttlBufferMs;
      });

    if (missing.length) {
      try {
        const generated = await attachmentsService.createSignedUrls(missing);
        Object.entries(generated).forEach(([path, url]) => {
          signedUrlCache.current[path] = {
            url,
            expiresAt:
              now + (appConfig.supabase.signedUrlTTL ?? 60) * 1000 - ttlBufferMs,
          };
        });
      } catch (err) {
        console.error("Error creating signed URLs:", err);
      }
    }

    const next: Record<string, string | null> = {};
    attachments.forEach((att) => {
      next[att.file_path] = signedUrlCache.current[att.file_path]?.url ?? null;
    });
    setSignedUrls(next);
  }, [attachments]);

  useEffect(() => {
    void refreshSignedUrls();
  }, [refreshSignedUrls]);

  return {
    attachments,
    signedUrls,
    loading,
    error,
    uploadFiles,
    deleteAttachment,
    refetch: fetchAttachments,
  };
}
