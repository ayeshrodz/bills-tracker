import { useEffect, useState } from "react";
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
};

const BUCKET = "bill-attachments";

export function useBillAttachments(billId: string | null) {
  const [attachments, setAttachments] = useState<BillAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!billId) return;
    void fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billId]);

  async function fetchAttachments() {
    if (!billId) return;
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
  }

  async function uploadFiles(
    files: FileList | File[],
    fileType: "bill" | "payment" | "other" = "other"
  ) {
    if (!billId) return;
    const fileArray = Array.from(files);
    setError(null);

    for (const file of fileArray) {
      const ext = file.name.split(".").pop() || "";
      const path = `${billId}/${crypto.randomUUID()}.${ext}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (storageError) {
        console.error("Error uploading file:", storageError);
        setError(storageError.message);
        continue;
      }

      const { data, error: dbError } = await supabase
        .from("bill_attachments")
        .insert({
          bill_id: billId,
          file_type: fileType,
          file_name: file.name,
          file_path: storageData?.path ?? path,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Error saving attachment row:", dbError);
        setError(dbError.message);
        continue;
      }

      if (data) {
        setAttachments((prev) => [data as BillAttachment, ...prev]);
      }
    }
  }

  async function deleteAttachment(att: BillAttachment) {
    setError(null);

    // remove from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([att.file_path]);

    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
      setError(storageError.message);
      return;
    }

    // remove DB row
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
