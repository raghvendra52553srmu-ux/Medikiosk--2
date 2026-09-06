import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  callPatient,
  completePatient,
  getDoctorQueue,
  markAbsent,
} from "@/services/queueService";
import { currentStaff } from "@/services/authService";
import { errorMessage } from "@/services/apiClient";
import { useDoctorQueueSocket } from "@/hooks/useQueueSocket";
import { qk } from "@/lib/queryClient";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";

import { cn } from "@/utils/cn";
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2, RefreshCw, Search, Wifi } from "lucide-react";

const statusTone = {
  waiting: { label: "Waiting", tone: "quiet" },
  almost: { label: "Almost", tone: "flag" },
  called: { label: "Called", tone: "solid" },
  "in-consultation": { label: "In room", tone: "solid" },
  completed: { label: "Done", tone: "neutral" },
};

const historyTone = {
  pending: { label: "Not started", tone: "quiet", icon: Clock },
  "in-progress": { label: "In progress", tone: "flag", icon: Loader2 },
  ready: { label: "Ready", tone: "done", icon: CheckCircle2 },
};

const COLUMNS = "grid-cols-[76px_minmax(150px,1.1fr)_minmax(180px,1.6fr)_120px_84px_80px_92px_104px]";

export default function DoctorQueue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [confirming, setConfirming] = useState(null);

  // Which board to show is decided by the signed-in account, not the URL.
  const { data: staff } = useQuery({ queryKey: qk.me(), queryFn: currentStaff, staleTime: 5 * 60_000 });
  const doctorId = staff?.doctorId ?? undefined;

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: qk.queue(doctorId),
    queryFn: () => getDoctorQueue(doctorId),
    // A safety net under the socket: the board stays fresh even if the
    // websocket is blocked by hospital networking.
    refetchInterval: 20_000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["queue"] });
  }, [queryClient]);

  // Live push — another clinician calling a patient updates this board at once.
  useDoctorQueueSocket(doctorId, invalidate);

  const mutate = useMutation({
    mutationFn: ({ row, action }) => {
      const fn = action === "call" ? callPatient : action === "complete" ? completePatient : markAbsent;
      return fn(row.tokenId);
    },
    onSuccess: (_data, { row, action }) => {
      const verb = action === "call" ? "called" : action === "complete" ? "completed" : "marked absent";
      toast(`${row.tokenNumber} ${verb}.`);
      invalidate();
    },
    onError: (err) => toast(errorMessage(err), { tone: "flag" }),
  });

  const act = (row, action) => mutate.mutate({ row, action });

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(r => {
      if (onlyFlagged && r.attentionItems === 0) return false;
      if (!needle) return true;
      return [r.tokenNumber, r.patientName, r.chiefComplaint].some(v => v.toLowerCase().includes(needle));
    });
  }, [rows, query, onlyFlagged]);

  const loading = isLoading;

  return (
    <DoctorLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-ink">Patient queue</h1>
            <p className="mt-1 text-base text-ink/55">
              {rows.length} in the line · {rows.filter(r => r.historyStatus === "ready").length} with history ready ·
              {" "}{rows.filter(r => r.attentionItems > 0).length} needing sign-off
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/60" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Token, name or complaint"
                aria-label="Filter queue"
                className="h-10 w-[240px] rounded-[10px] border border-line bg-white/60 pl-9 pr-3 text-base text-ink backdrop-blur-xl transition-[border-color,background-color] duration-300 placeholder:text-ink/60 hover:bg-white/80 focus:border-ink/35 focus:bg-white/90 focus:outline-none"
              />
            </div>
            <Button
              size="md"
              variant="secondary"
              icon={<RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />}
              onClick={() => void refetch()}
            >
              Refresh
            </Button>
            <button
              onClick={() => setOnlyFlagged(v => !v)}
              aria-pressed={onlyFlagged}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-[10px] border px-3 text-base font-medium transition-all duration-300 [transition-timing-function:var(--ease-glide)]",
                onlyFlagged ? "border-ink bg-ink text-white" : "border-line bg-white/60 text-ink/70 hover:border-ink/25 hover:text-ink"
)}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Flagged only
            </button>
          </div>
        </div>

        {loading ? (
          <SkeletonRows rows={7} cols={8} />
) : isError ? (
          <EmptyState
            tone="alert"
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Could not load the queue"
            description={errorMessage(error)}
            action={
              <Button onClick={() => void refetch()} icon={<RefreshCw className="h-3.5 w-3.5" />}>
                Try again
              </Button>
            }
          />
) : rows.length === 0 ? (
          <EmptyState
            icon={<Wifi className="h-6 w-6" />}
            title="No patients in the line yet"
            description="Tokens appear here the moment someone registers at a kiosk — this board updates live, so there is nothing to refresh."
          />
) : visible.length === 0 ? (
          <div className="glass rounded-[14px] px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">All caught up</p>
            <p className="mx-auto mt-1.5 max-w-sm text-base leading-relaxed text-ink/55">
              No patient in the line matches this filter. Clear it to see the full queue again.
            </p>
            <Button variant="secondary" size="md" className="mt-4" onClick={() => { setQuery(""); setOnlyFlagged(false); }}>
              Clear filters
            </Button>
          </div>
) : (
          <div className="glass overflow-hidden rounded-[14px]">
            <div className={cn("hidden gap-4 border-b border-line bg-ink/[0.03] px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-ink/60 lg:grid", COLUMNS)}>
              <span>Token</span><span>Patient</span><span>Giving history for</span><span>History</span>
              <span>Docs</span><span>Flags</span><span>Est.</span><span />
            </div>

            <ul className="divide-y divide-line/80">
              {visible.map((row, i) => {
                const s = statusTone[row.status];
                const h = historyTone[row.historyStatus];
                const HIcon = h.icon;
                return (
                  <li
                    key={row.tokenId}
                    style={{ ["--i" ]: i }}
                    className={cn(
                      "reveal group relative transition-colors duration-[320ms] [transition-timing-function:var(--ease-glide)] hover:bg-white/80",
                      (row.status === "called" || row.status === "in-consultation") && "bg-white/75"
)}
                  >
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 w-[2px] transition-all duration-[420ms]",
                        row.status === "called" || row.status === "in-consultation"
                          ? "bg-ink"
                          : row.attentionItems > 0 ? "bg-ink/35" : "bg-transparent group-hover:bg-ink/15"
)}
                      aria-hidden
                    />
                    {/* Desktop row */}
                    <div className={cn("hidden gap-4 items-center px-4 py-3 lg:grid", COLUMNS)}>
                      <span className="tabular font-mono text-base font-semibold text-ink">{row.tokenNumber}</span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-medium text-ink">{row.patientName}</p>
                        <p className="tabular mt-0.5 text-sm text-ink/60">{row.age} / {row.sex}</p>
                      </div>
                      <p className="truncate text-base text-ink/75">{row.chiefComplaint}</p>
                      <Badge tone={h.tone}><HIcon className={cn("h-3 w-3", row.historyStatus === "in-progress" && "animate-spin")} />{h.label}</Badge>
                      <span className="flex items-center gap-1.5 text-sm sm:text-base text-ink/65">
                        <FileText className="h-3.5 w-3.5 text-ink/60" />{row.documentsCount}
                      </span>
                      <span>
                        {row.attentionItems > 0 ? (
                          <Badge tone="flag"><AlertTriangle className="h-3 w-3" />{row.attentionItems}</Badge>
) : (
                          <span className="text-sm sm:text-base text-ink/60">—</span>
)}
                      </span>
                      <span className="tabular text-sm sm:text-base text-ink/70">{row.estimatedTime}</span>
                      <div className="flex justify-end gap-1">
                        {row.status === "waiting" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={mutate.isPending}
                            onClick={() => act(row, "call")}
                          >
                            Call
                          </Button>
)}
                        {(row.status === "called" || row.status === "in-consultation") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={mutate.isPending}
                            onClick={() => act(row, "complete")}
                          >
                            Done
                          </Button>
)}
                        <Button
                          size="sm"
                          variant={row.status === "called" || row.status === "in-consultation" ? "primary" : "ghost"}
                          onClick={() => navigate(`/doctor/patient/${row.tokenId}`)}
                        >
                          Review
                        </Button>
                      </div>
                    </div>

                    {/* Compact row */}
                    <div className="p-4 lg:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2">
                            <span className="tabular font-mono text-base font-semibold text-ink">{row.tokenNumber}</span>
                            <span className="text-base font-medium text-ink">{row.patientName}</span>
                          </p>
                          <p className="mt-1 truncate text-base text-ink/65">{row.chiefComplaint}</p>
                          <p className="tabular mt-0.5 text-sm text-ink/60">{row.age} / {row.sex} · {row.estimatedTime}</p>
                        </div>
                        <Badge tone={s.tone} mark={s.tone === "quiet" ? "ring" : "dot"}>{s.label}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                        <Badge tone={h.tone}><HIcon className="h-3 w-3" />{h.label}</Badge>
                        <Badge tone="quiet"><FileText className="h-3 w-3" />{row.documentsCount}</Badge>
                        {row.attentionItems > 0 && <Badge tone="flag"><AlertTriangle className="h-3 w-3" />{row.attentionItems}</Badge>}
                        <div className="ml-auto flex gap-1">
                          {row.status === "waiting" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={mutate.isPending}
                              onClick={() => act(row, "call")}
                            >
                              Call
                            </Button>
)}
                          {(row.status === "called" || row.status === "in-consultation") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={mutate.isPending}
                              onClick={() => act(row, "complete")}
                            >
                              Done
                            </Button>
)}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirming(row)}
                          >
                            Absent
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/doctor/patient/${row.tokenId}`)}>
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
);
              })}
            </ul>
          </div>
)}

        <p className="mt-3 text-sm leading-relaxed text-ink/60">
          Queue times are estimates from the running room pace and shift as consultations end. Patient names are
          abbreviated on this screen because the display faces the corridor.
        </p>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title={`Mark ${confirming?.tokenNumber ?? ""} absent?`}
        description={`${confirming?.patientName ?? "This patient"} will be removed from today's line. They will need a new token to rejoin the queue.`}
        confirmLabel="Mark absent"
        destructive
        busy={mutate.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) act(confirming, "absent");
          setConfirming(null);
        }}
      />
    </DoctorLayout>
);
}
