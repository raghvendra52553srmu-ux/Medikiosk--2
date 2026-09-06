import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getToken } from "@/services/patientService";
import { errorMessage } from "@/services/apiClient";
import { useTokenSocket } from "@/hooks/useQueueSocket";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/components/ui/Toast";

import { cn } from "@/utils/cn";
import { Megaphone, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";

const statusCopy = {
  waiting: { label: "Waiting", action: "Stay in the waiting area. We will ring your number." },
  almost: { label: "Almost your turn", action: "Please move to the door of the consultation room." },
  called: { label: "Being called", action: "Your number has been called. Please go in." },
  "in-consultation": { label: "With the doctor", action: "Your consultation is in progress." },
  completed: { label: "Finished", action: "Consultation complete. Collect medicines as advised." },
};

export default function QueuePage() {
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const { toast } = useToast();
  const [recallSent, setRecallSent] = useState(false);

  const {
    data: token,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: qk.token(tokenId ?? "current"),
    queryFn: () => getToken(tokenId),
    // Polling is the fallback; the socket below is what makes it feel instant.
    refetchInterval: 15_000,
  });

  const onPush = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Live: the moment the doctor calls this number, this screen changes.
  useTokenSocket(token?.id, onPush);

  if (isLoading) {
    return (
      <KioskLayout title="Queue status" intro="Live position in this doctor's OPD line.">
        <div aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading your queue position…</span>
          <Skeleton className="h-[210px] w-full rounded-[16px]" />
          <div className="mt-3 space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-[11px]" />
))}
          </div>
        </div>
      </KioskLayout>
);
  }

  if (isError || !token) {
    return (
      <KioskLayout title="Queue status">
        <EmptyState
          tone="alert"
          icon={<TriangleAlert className="h-5 w-5" />}
          title="Could not load your queue position"
          description={errorMessage(error) || "We could not find a token for this kiosk session."}
          action={<Button size="lg" onClick={() => void refetch()}>Try again</Button>}
          secondaryAction={
            <Button size="lg" variant="secondary" onClick={() => navigate("/patient")}>
              Back to start
            </Button>
          }
        />
      </KioskLayout>
);
  }

  const ahead = token.patientsAhead;
  const serving = token.currentServing;
  const state =
    token.status === "in-consultation" || token.status === "called"
      ? "called"
      : ahead === 0
        ? "called"
        : ahead <= 2
          ? "almost"
          : "waiting";
  const copy = statusCopy[state];
  const updatedAt = new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const refreshing = isFetching;

  const refresh = () => void refetch();

  return (
    <KioskLayout
      title="Your place in the queue"
      intro={copy.action}
      aside={<Badge tone={state === "waiting" ? "neutral" : "solid"} mark={state === "waiting" ? "ring" : "dot"}>{copy.label}</Badge>}
    >
      <div className="overflow-hidden rounded-[18px] border-2 border-zinc-200 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900 text-left">
        <div className="grid grid-cols-1 items-center gap-5 border-b border-zinc-200 px-5 py-5 sm:grid-cols-[auto_1fr] sm:px-6 dark:border-zinc-800">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Your Token</p>
            <p className="tabular mt-1 font-mono text-6xl font-black leading-none tracking-wider text-emerald-600 dark:text-emerald-400 sm:text-7xl">
              {token.number}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Now Serving</p>
              <p className={cn("tabular mt-1 font-mono text-3xl font-extrabold leading-none text-zinc-900 dark:text-zinc-50")}>
                {serving}
              </p>
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Ahead of You</p>
              <p className="tabular mt-1 font-mono text-2xl font-black leading-tight text-emerald-700 dark:text-emerald-400 sm:text-3xl">
                {state === "called" ? "Your turn" : ahead === 1 ? "1 patient" : `${ahead} patients`}
              </p>
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Est. Call Time</p>
              <p className="tabular mt-1 text-lg font-extrabold text-zinc-900 dark:text-zinc-100">{token.estimatedTime}</p>
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Report By</p>
              <p className="tabular mt-1 text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{token.recommendedArrival}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6">
          <p className="min-w-0 truncate text-sm sm:text-base text-ink/55">
            {token.department} OPD · {token.doctorName}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="tabular text-sm text-ink/60">Updated {updatedAt}</span>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-[8px] border border-line px-2 py-1 text-sm font-medium text-ink/70 transition-colors hover:border-ink/25 hover:text-ink disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm sm:text-base leading-relaxed text-ink/60">
        Estimated time moves as patients leave the room — it is a guide, not a promised consultation time.
      </p>

      <section className="mt-6">
        <h2 className="mb-2 font-display text-base font-semibold tracking-[-0.015em] text-ink">Board</h2>
        {/*
          Only real, server-known numbers are shown. The prototype rendered a
          fabricated nine-token list here; inventing other patients' positions on
          a public screen would be both misleading and a privacy problem.
        */}
        <ul className="glass divide-y divide-line overflow-hidden rounded-[14px]">
          {/* When the patient IS the number being served, one row — not the
              same token listed twice. */}
          {serving !== "—" && serving !== token.number && (
            <li className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="tabular font-mono text-base font-semibold text-ink">{serving}</span>
              <span className="text-sm text-ink/60">In the room</span>
            </li>
)}
          <li className="flex items-center justify-between gap-3 bg-ink/[0.035] px-4 py-3">
            <span className="flex items-center gap-2.5">
              <span className="tabular font-mono text-base font-semibold text-ink">{token.number}</span>
              <Badge tone="solid">You</Badge>
            </span>
            <span className="text-sm text-ink/60">
              {serving === token.number ? "In the room" : ahead === 0 ? "Next" : `${ahead} ahead of you`}
            </span>
          </li>
        </ul>
      </section>

      <div className="glass mt-4 flex items-start gap-3 rounded-[13px] p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink/60" />
        <p className="text-sm sm:text-base leading-relaxed text-ink/60">
          The board shows numbers only. Names, complaints and reports never appear on it, and this screen is cleared
          automatically if you walk away.
        </p>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        <Button size="lg" onClick={() => navigate("/patient/review")}>Back to my review</Button>
        <Button
          variant="secondary"
          size="lg"
          icon={<Megaphone className="h-4 w-4" />}
          onClick={() => {
            setRecallSent(true);
            toast("Request sent to the OPD desk.", { detail: `${token.number} will be called again at the room door.` });
          }}
        >
          {recallSent ? "Desk notified" : "Ask desk to recall my number"}
        </Button>
      </div>
    </KioskLayout>
);
}
