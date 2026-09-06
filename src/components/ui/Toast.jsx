import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,

} from "react";
import { cn } from "@/utils/cn";
import { Check, X, TriangleAlert, Info } from "lucide-react";

const ToastContext = createContext({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

let seq = 0;

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => setItems(prev => prev.filter(t => t.id !== id)), []);

  const toast = useCallback((message, opts) => {
    const id = ++seq;
    setItems(prev => [...prev.slice(-2), { id, message, tone: opts?.tone ?? "plain", detail: opts?.detail }]);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="status"
        aria-live="polite"
      >
        {items.map(item => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
))}
      </div>
    </ToastContext.Provider>
);
}

function ToastCard({ item, onDismiss }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), 4200);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  const Icon = item.tone === "flag" ? TriangleAlert : item.tone === "info" ? Info : Check;

  return (
    <div
      className={cn(
        "glass-strong animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[12px] px-4 py-3"
)}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          item.tone === "flag" ? "border border-ink/40" : "bg-ink text-white"
)}
      >
        <Icon className="h-3 w-3" strokeWidth={2.4} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium leading-snug text-ink">{item.message}</p>
        {item.detail && <p className="mt-0.5 text-sm sm:text-base leading-snug text-ink/55">{item.detail}</p>}
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="-mr-1 shrink-0 rounded-md p-1 text-ink/60 transition-colors hover:bg-ink/[0.06] hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
);
}
