import React, { useEffect, useState } from "react";
import { useBillAttachments } from "../hooks/useBillAttachments";
import { useToast } from "../hooks/useToast";
import ConfirmDialog from "./ConfirmDialog";
import type { BillAttachment } from "../types/attachments";

type Props = {
  billId: string;
};

export const BillAttachmentsPanel = ({ billId }: Props) => {
  const {
    attachments,
    signedUrls,
    loading,
    error,
    uploadFiles,
    deleteAttachment,
  } = useBillAttachments(billId);

  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BillAttachment | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const { toastSuccess, toastError } = useToast();

  useEffect(() => {
    if (error) {
      toastError(error);
    }
  }, [error, toastError]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = e.target;
    if (!input.files) return;
    setUploading(true);
    try {
      await uploadFiles(input.files, "other");
      toastSuccess("Attachments uploaded");
    } catch (err) {
      toastError(err);
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAttachment(pendingDelete);
      toastSuccess("Attachment deleted");
    } catch (err) {
      toastError(err);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <section className="mt-8">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">
        Attachments
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Attach the bill PDF or payment confirmation (images or PDFs).
      </p>

      <div className="mb-4">
        <label className="inline-flex items-center px-3 py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60">
          <span>Upload files</span>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        {uploading && (
          <p className="text-xs text-slate-500 mt-2">Uploading…</p>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-xs text-slate-500 mb-2">Loading attachments…</p>
      )}

      {attachments.length === 0 ? (
        <p className="text-xs text-slate-500">No attachments yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <a
                  href={signedUrls[att.file_path] ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sky-600 hover:underline"
                >
                  {att.file_name}
                </a>
                <p className="text-[11px] text-slate-500">
                  {att.mime_type || "file"} •{" "}
                  {att.size_bytes
                    ? `${(att.size_bytes / 1024).toFixed(1)} KB`
                    : "size unknown"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingDelete(att)}
                className="shrink-0 rounded-md bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete attachment?"
        description={
          pendingDelete ? (
            <>
              <span className="font-semibold">{pendingDelete.file_name}</span>{" "}
              will be removed permanently.
            </>
          ) : null
        }
        confirmLabel="Delete"
        destructive
        confirmLoading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
};
