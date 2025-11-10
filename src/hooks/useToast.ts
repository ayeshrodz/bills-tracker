import { useCallback, useContext } from "react";
import {
  ToastContext,
  type ToastContextValue,
  type ToastVariant,
} from "../contexts/ToastContext";
import { normalizeError } from "../utils/errors";

export const useToast = () => {
  const ctx = useContext<ToastContextValue | undefined>(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", duration?: number) =>
      ctx.pushToast({ message, variant, duration }),
    [ctx]
  );

  const toastSuccess = useCallback(
    (message: string) => toast(message, "success"),
    [toast]
  );

  const toastInfo = useCallback(
    (message: string) => toast(message, "info"),
    [toast]
  );

  const toastWarning = useCallback(
    (message: string) => toast(message, "warning"),
    [toast]
  );

  const toastError = useCallback(
    (err: unknown) => toast(normalizeError(err), "error", 6000),
    [toast]
  );

  return {
    ...ctx,
    toast,
    toastSuccess,
    toastInfo,
    toastWarning,
    toastError,
  };
};
