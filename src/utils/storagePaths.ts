export const sanitizeFileNamePart = (name: string): string => {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_") // letters, numbers, _, ., -
    .replace(/^_+/, "")
    .replace(/_+$/, "");

  return cleaned || "file";
};

// Build a unique, sanitized storage path for an attachment
export const buildAttachmentPath = (billId: string, originalName: string): string => {
  const hasDot = originalName.includes(".");
  const ext = hasDot ? originalName.split(".").pop() || "" : "";
  const base = hasDot
    ? originalName.slice(0, -(ext.length + 1))
    : originalName;

  const safeBase = sanitizeFileNamePart(base);

  const safeFileName =
    ext.length > 0 ? `${safeBase}.${ext}` : safeBase;

  // You can swap crypto.randomUUID() with Date.now() if you prefer
  return `${billId}/${crypto.randomUUID()}_${safeFileName}`;
};
