import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import {
  ToastContext,
  type Toast,
  type ToastContextValue,
  type ToastInput,
  type ToastVariant,
} from "./ToastContext";

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: "bg-white/70 text-slate-900 border border-white/60",
  success: "bg-emerald-200/70 text-emerald-950 border border-white/60",
  warning: "bg-amber-200/80 text-amber-950 border border-white/60",
  error: "bg-rose-200/80 text-rose-950 border border-white/60",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = toast.id ?? crypto.randomUUID();
    const duration = toast.duration ?? 4000;
    const variant = toast.variant ?? "info";

    setToasts((prev) => [...prev, { ...toast, id, duration, variant }]);
    return id;
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      pushToast,
      dismissToast,
      clearToasts,
    }),
    [toasts, pushToast, dismissToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

function ToastViewport() {
  const ctx = useContext(ToastContext);
  if (!ctx || ctx.toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-6 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-3 px-4">
      {ctx.toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={ctx.dismissToast}
        />
      ))}
    </div>
  );
}

type ToastItemProps = {
  toast: Toast;
  onDismiss: (id: string) => void;
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const closingRef = useRef(false);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const handleDismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    window.setTimeout(() => onDismiss(toast.id), 220);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = window.setTimeout(handleDismiss, toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.duration, handleDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-5 text-sm shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300 ease-out ${VARIANT_STYLES[toast.variant ?? "info"]} ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-xs font-semibold uppercase tracking-wide opacity-70 transition hover:opacity-100"
      >
        Close
      </button>
    </div>
  );
}
