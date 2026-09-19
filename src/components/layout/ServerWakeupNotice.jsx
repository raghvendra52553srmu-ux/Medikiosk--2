import { useEffect, useState, useRef } from "react";
import { checkHealth } from "@/services/apiClient";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Graceful Render cold-start / wake-up notice.
 *
 * Implements controlled exponential backoff (2s, 4s, 8s; max 3 retries).
 * Strictly non-hammering: never runs an infinite polling loop.
 */
export function ServerWakeupNotice() {
  const [state, setState] = useState("idle"); // 'idle' | 'waking' | 'connected' | 'failed'
  const [attempt, setAttempt] = useState(1);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const delays = [2000, 4000, 8000];

    async function probeServer() {
      // First quick probe
      const first = await checkHealth(4000);
      if (!mountedRef.current) return;

      if (first.ok) {
        setState("idle");
        return;
      }

      // Backend is cold or sleeping on Render
      setState("waking");

      for (let i = 0; i < delays.length; i++) {
        if (!mountedRef.current) return;
        setAttempt(i + 1);
        await new Promise((r) => setTimeout(r, delays[i]));
        if (!mountedRef.current) return;

        const check = await checkHealth(6000);
        if (!mountedRef.current) return;

        if (check.ok) {
          setState("connected");
          setTimeout(() => {
            if (mountedRef.current) setState("idle");
          }, 2000);
          return;
        }
      }

      // If attempts exhausted, stop automatically to avoid hammering hosting
      if (mountedRef.current) {
        setState("failed");
      }
    }

    void probeServer();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleManualRetry = async () => {
    setState("waking");
    setAttempt(1);
    const check = await checkHealth(6000);
    if (!mountedRef.current) return;
    if (check.ok) {
      setState("connected");
      setTimeout(() => {
        if (mountedRef.current) setState("idle");
      }, 2000);
    } else {
      setState("failed");
    }
  };

  if (state === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-line bg-white/95 p-3.5 shadow-xl backdrop-blur-xl transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900/95"
    >
      {state === "waking" && (
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              {attempt === 1 ? "Connecting to MediKiosk server..." : "MediKiosk server is starting..."}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Please wait a few seconds (attempt {attempt}/3)...
            </p>
          </div>
        </div>
      )}

      {state === "connected" && (
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Connected</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">MediKiosk backend is ready.</p>
          </div>
        </div>
      )}

      {state === "failed" && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Server waking took longer</p>
              <p className="text-xs text-zinc-500">Tap to check again</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualRetry}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
}
