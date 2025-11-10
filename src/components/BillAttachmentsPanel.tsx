import React, { useEffect, useState } from "react";
import { useBillAttachments } from "../hooks/useBillAttachments";

type Props = {
  billId: string;
};

export const BillAttachmentsPanel = ({ billId }: Props) => {
  const {
    attachments,
    loading,
    error,
    uploadFiles,
    deleteAttachment,
    getSignedUrl,
  } = useBillAttachments(billId);

  const [signedUrls, setSignedUrls] = useState<Record<string, string | null>>(
    {}
  );

  // Pre-fetch signed URLs whenever attachments change
  useEffect(() => {
    let cancelled = false;

    const loadSignedUrls = async () => {
      if (!attachments.length) {
        if (!cancelled) setSignedUrls({});
        return;
      }

      const entries = await Promise.all(
        attachments.map(async (att) => {
          const url = await getSignedUrl(att.file_path);
          return [att.file_path, url] as const;
        })
      );

      if (!cancelled) {
        setSignedUrls(Object.fromEntries(entries));
      }
    };

    void loadSignedUrls();

    return () => {
      cancelled = true;
    };
  }, [attachments, getSignedUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    // For now treat all as "other". You could add separate inputs for 'bill' vs 'payment'.
    void uploadFiles(e.target.files, "other");
    e.target.value = "";
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
        <label className="inline-flex items-center px-3 py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
          <span>Upload files</span>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileChange}
          />
        </label>
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
                onClick={() => deleteAttachment(att)}
                className="shrink-0 rounded-md bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
