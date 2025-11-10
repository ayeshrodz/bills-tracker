import { createContext } from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

export type Toast = {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

export type ToastInput = Omit<Toast, "id"> & { id?: string };

export type ToastContextValue = {
  toasts: Toast[];
  pushToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined
);
