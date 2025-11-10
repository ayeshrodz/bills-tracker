export type AttachmentCategory = "bill" | "payment" | "other";

export interface BillAttachment {
  id: string;
  bill_id: string;
  file_type: string; // or AttachmentCategory if your DB uses those exact strings
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_at: string;
  user_id?: string | null;
}