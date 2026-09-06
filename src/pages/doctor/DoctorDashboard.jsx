import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { useToast } from "@/components/ui/Toast";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  callPatient,
  completePatient,
  getQueueMetrics,
  markAbsent,
  startConsultation,
} from "@/services/queueService";
import { currentStaff } from "@/services/authService";
import { errorMessage } from "@/services/apiClient";
import { useDoctorQueueSocket } from "@/hooks/useQueueSocket";
import { qk } from "@/lib/queryClient";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import {
  AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardCheck,
  FileText, RefreshCw, Users,
} from "lucide-react";

const PAUSE_KEY = "medikiosk.doctor.paused";

function statusLabel(s) {
  if (s === "in-consultation") return "In room";
  if (s === "called") return "Called";
  if (s === "almost") return "Almost";
  if (s === "completed") return "Done";
  return "Waiting";
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmAbsent, setConfirmAbsent] = useState(null);
  const [paused, setPaused] = useState(() => {
    try {
      return localStorage.getItem(PAUSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const { data: staff } = useQuery({ queryKey: qk.me(), queryFn: currentStaff, staleTime: 5 * 60_000 });
  const doctorId = staff?.doctorId ?? undefined;

  const {
    data: metrics,
    isLoading: loading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: qk.queueMetrics(doctorId),
    queryFn: () => getQueueMetrics(doctorId),
    refetchInterval: 20_000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["queue"] });
  }, [queryClient]);

  useDoctorQueueSocket(doctorId, invalidate);

  const next = metrics?.next ?? null;

  const action = useMutation({
    mutationFn: ({ tokenId, kind }) => {
      const fn =
        kind === "call" ? callPatient : kind === "start" ? startConsultation : kind === "complete" ? completePatient : markAbsent;
      return fn(tokenId);
    },
    onSuccess: (data, { kind }) => {
      const detail = {
        call: "Patient will be shown as Called on the queue board.",
        start: undefined,
        complete: "Removed from the active line.",
        absent: "Released from the line; the desk can re-add them.",
      };
      const verb = kind === "call" ? "called" : kind === "start" ? "— consultation started" : kind === "complete" ? "completed" : "marked absent";
      toast(`${data.number} ${verb}.`, { detail: detail[kind] });
      invalidate();
    },
    onError: (err) => toast(errorMessage(err), { tone: "flag" }),
  });

  const togglePause = () => {
    setPaused(p => {
      const nextVal = !p;
      try {
        localStorage.setItem(PAUSE_KEY, nextVal ? "1" : "0");
      } catch {
        /* ignore */
      }
      toast(nextVal ? "Queue paused for this station." : "You are back on the queue.", {
        tone: nextVal ? "flag" : "plain",
        detail: nextVal ? "No new tokens will be highlighted until you resume." : undefined,
      });
      return nextVal;
    });
  };

  const onCall = (tokenId) => action.mutate({ tokenId, kind: "call" });
  const onStart = (tokenId) => action.mutate({ tokenId, kind: "start" });
  const onComplete = (tokenId) => action.mutate({ tokenId, kind: "complete" });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning OPD" : hour < 17 ? "Afternoon OPD" : "Evening OPD";

  const cards = metrics
    ? [
        {
          k: "Seen today",
          v: String(metrics.completedToday),
          sub: `of ${metrics.slotCapacity} slot capacity`,
        },
        {
          k: "In your queue",
          v: String(metrics.inQueue),
          sub: `${metrics.historyReady} with history ready`,
        },
        {
          k: "Median wait",
          v: metrics.medianWaitMin === 0 ? "—" : `${metrics.medianWaitMin}m`,
          sub: "target under 30m",
        },
        {
          k: "Awaiting sign-off",
          v: String(metrics.awaitingSignOff),
          sub: "history ready, still in line",
        },
      ]
    : [];

  return (
    <DoctorLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="reveal mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-4xl md:text-5xl">
              {greeting}
            </h1>
            <p className="mt-1 text-base text-ink/55">
              General Medicine · Hall 2 ·{" "}
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {paused && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-ink/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                  Station paused
                </span>
)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => void refetch()}
              icon={<RefreshCw className={isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
            >
              Refresh
            </Button>
            <Button variant="secondary" size="md" onClick={togglePause}>
              {paused ? "Resume OPD" : "Take a break"}
            </Button>
            <Button
              size="md"
              onClick={() => navigate("/doctor/queue")}
              iconRight={<ArrowUpRight className="h-3.5 w-3.5" />}
            >
              Open queue
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div
          className="reveal mb-4 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
          style={{ ["--i" ]: 1 }}
        >
          {loading || !metrics
            ? [0, 1, 2, 3].map(i => (
                <div key={i} className="bg-white/65 px-4 py-3.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-2 h-7 w-12" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
))
            : cards.map(m => (
                <div
                  key={m.k}
                  className="bg-white/65 px-4 py-3.5 backdrop-blur-xl transition-colors duration-300 hover:bg-white/85"
                >
                  <p className="text-sm uppercase tracking-[0.12em] text-ink/60">{m.k}</p>
                  <p className="tabular mt-1.5 font-display text-3xl md:text-4xl font-semibold leading-none tracking-[-0.03em] text-ink">
                    {m.v}
                  </p>
                  <p className="mt-1.5 text-sm text-ink/60">{m.sub}</p>
                </div>
))}
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
          {/* Next / current patient */}
          {loading ? (
            <Card padding="lg" className="min-h-[220px]">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-4 h-14 w-full" />
              <Skeleton className="mt-3 h-10 w-48" />
            </Card>
) : isError ? (
            <EmptyState
              tone="alert"
              className="h-full justify-center"
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Could not load your queue"
              description={errorMessage(error)}
              action={
                <Button size="md" onClick={() => void refetch()} icon={<RefreshCw className="h-3.5 w-3.5" />}>
                  Try again
                </Button>
              }
            />
) : next === null ? (
            <EmptyState
              className="h-full justify-center"
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="All caught up"
              description="No patient is waiting in this line right now. This board updates live — when a kiosk issues a token for your OPD, they appear here straight away."
              action={
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => void refetch()}
                  icon={<RefreshCw className={isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
                >
                  Refresh
                </Button>
              }
            />
) : (
            <Card padding="none" className="reveal overflow-hidden" style={{ ["--i" ]: 2 }}>
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <SectionHeading
                  title={
                    next.status === "in-consultation"
                      ? "With you now"
                      : next.status === "called"
                      ? "Called — waiting at the door"
                      : "Next in line"
                  }
                  meta={
                    paused
                      ? "Queue paused — new tokens are not being routed to you"
                      : `${next.historyStatus === "ready" ? "History ready" : next.historyStatus === "in-progress" ? "History in progress" : "History pending"} · Est. ${next.estimatedTime}`
                  }
                />
                <div className="flex shrink-0 items-center gap-2">
                  {paused && (
                    <Badge tone="outline" mark="ring">
                      Paused
                    </Badge>
)}
                  <Badge tone="solid" mark="dot">
                    {statusLabel(next.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 px-5 py-4 sm:grid-cols-[auto_1fr]">
                <div className="flex items-center gap-3.5">
                  <span className="tabular flex h-14 w-14 flex-col items-center justify-center rounded-[12px] bg-ink font-mono text-base font-semibold leading-none text-white">
                    {next.tokenNumber.split("-")[0]}
                    <span className="mt-1 text-lg">{next.tokenNumber.split("-")[1]}</span>
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                      {next.patientName}
                    </p>
                    <p className="mt-0.5 text-sm sm:text-base text-ink/55">
                      {next.age} / {next.sex}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.12em] text-ink/60">
                    Giving the history for
                  </p>
                  <p className="mt-1 text-base leading-relaxed text-ink">{next.chiefComplaint}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink/55">
                    {next.historyStatus === "ready" ? (
                      <Badge tone="done">
                        <ClipboardCheck className="h-3 w-3" />
                        History ready
                      </Badge>
) : next.historyStatus === "in-progress" ? (
                      <Badge tone="flag" mark="ring">
                        History in progress
                      </Badge>
) : (
                      <Badge tone="quiet" mark="ring">
                        History pending
                      </Badge>
)}
                    <Badge tone="quiet">
                      <FileText className="h-3 w-3" />
                      {next.documentsCount} document{next.documentsCount === 1 ? "" : "s"}
                    </Badge>
                    {next.attentionItems > 0 && (
                      <Badge tone="flag">
                        <AlertTriangle className="h-3 w-3" />
                        {next.attentionItems} flag{next.attentionItems === 1 ? "" : "s"}
                      </Badge>
)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-line bg-ink/[0.02] px-5 py-3">
                <Button
                  size="md"
                  onClick={() => navigate(`/doctor/patient/p-${next.tokenNumber.toLowerCase()}`)}
                >
                  Open file
                </Button>
                {next.status === "waiting" || next.status === "almost" ? (
                  <Button size="md" variant="secondary" onClick={() => onCall(next.tokenId)}>
                    Call patient
                  </Button>
) : null}
                {next.status === "called" ? (
                  <Button size="md" variant="secondary" onClick={() => onStart(next.tokenId)}>
                    Start consultation
                  </Button>
) : null}
                {(next.status === "called" || next.status === "in-consultation") && (
                  <Button size="md" variant="secondary" onClick={() => onComplete(next.tokenId)}>
                    Complete
                  </Button>
)}
                <Button
                  size="md"
                  variant="tertiary"
                  onClick={() =>
                    toast(`${next.tokenNumber} recalled over the hall speaker.`, {
                      detail: `${next.patientName} — please come to the consultation room.`,
                    })
                  }
                >
                  Recall
                </Button>
                <Button size="md" variant="tertiary" onClick={() => setConfirmAbsent(next)}>
                  Mark absent
                </Button>
              </div>
            </Card>
)}

          {/* Needs attention */}
          <Card padding="none" className="reveal overflow-hidden" style={{ ["--i" ]: 3 }}>
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <SectionHeading
                title="Needs your eye"
                meta={
                  paused
                    ? "Queue paused — held items stay here"
                    : "Flagged findings across the active line"
                }
              />
              <Badge tone="flag">{metrics?.flagged ?? 0}</Badge>
            </div>

            {loading ? (
              <div className="space-y-3 px-5 py-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
) : !metrics || metrics.flaggedRows.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-base font-medium text-ink">Nothing flagged</p>
                <p className="mt-1 text-sm sm:text-base leading-relaxed text-ink/60">
                  Flags appear when a scanned report has values outside range, or the patient marks a
                  severe symptom during history.
                </p>
              </div>
) : (
              <ul className="divide-y divide-line">
                {metrics.flaggedRows.map(q => (
                  <li
                    key={q.tokenId}
                    className="px-5 py-3.5 transition-colors duration-300 hover:bg-white/70"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                      <div className="min-w-0">
                        <p className="text-base font-medium text-ink">
                          <span className="tabular font-mono">{q.tokenNumber}</span> · {q.patientName}
                        </p>
                        <p className="mt-1 text-sm sm:text-base leading-relaxed text-ink/60">
                          {q.chiefComplaint} — {q.attentionItems}{" "}
                          {q.attentionItems === 1 ? "item needs" : "items need"} review before sign-off.
                        </p>
                        <button
                          onClick={() =>
                            navigate(`/doctor/patient/${q.tokenId}`)
                          }
                          className="mt-1.5 text-sm font-medium text-ink underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink"
                        >
                          Open draft
                        </button>
                      </div>
                    </div>
                  </li>
))}
              </ul>
)}

            <div className="flex items-center gap-2 border-t border-line bg-ink/[0.02] px-5 py-3 text-sm text-ink/60">
              <Users className="h-3.5 w-3.5" />
              Nothing here is a diagnosis. Confirm or correct before it enters the notes.
            </div>
          </Card>
        </div>

        {/* Compact rest-of-queue strip */}
        {metrics && metrics.active.length > 1 && (
          <Card padding="none" className="reveal mt-4 overflow-hidden" style={{ ["--i" ]: 4 }}>
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <SectionHeading
                title="Rest of the line"
                meta={`${Math.max(0, metrics.active.length - 1)} more after the current patient`}
              />
              <Button size="sm" variant="tertiary" onClick={() => navigate("/doctor/queue")}>
                Full queue
              </Button>
            </div>
            <ul className="divide-y divide-line">
              {metrics.active
                .filter(r => r.tokenNumber !== next?.tokenNumber)
                .slice(0, 5)
                .map(r => (
                  <li
                    key={r.tokenId}
                    className="flex flex-wrap items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/70"
                  >
                    <span className="tabular w-14 font-mono text-base font-semibold text-ink">
                      {r.tokenNumber}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-base text-ink">
                      {r.patientName}
                      <span className="text-ink/60"> · {r.chiefComplaint}</span>
                    </span>
                    <Badge
                      tone={
                        r.status === "called" || r.status === "in-consultation"
                          ? "solid"
                          : r.historyStatus === "ready"
                          ? "done"
                          : "quiet"
                      }
                      mark={r.status === "waiting" ? "ring" : "dot"}
                    >
                      {statusLabel(r.status)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="tertiary"
                      onClick={() => navigate(`/doctor/patient/${r.tokenId}`)}
                    >
                      Open
                    </Button>
                  </li>
))}
            </ul>
          </Card>
)}
      </div>

      <ConfirmDialog
        open={confirmAbsent !== null}
        title={`Mark ${confirmAbsent?.tokenNumber ?? ""} absent?`}
        description={`${confirmAbsent?.patientName ?? "This patient"} will be released from today's line. The desk can issue them a new token if they arrive later.`}
        confirmLabel="Mark absent"
        destructive
        busy={action.isPending}
        onCancel={() => setConfirmAbsent(null)}
        onConfirm={() => {
          if (confirmAbsent) action.mutate({ tokenId: confirmAbsent.tokenId, kind: "absent" });
          setConfirmAbsent(null);
        }}
      />
    </DoctorLayout>
);
}
