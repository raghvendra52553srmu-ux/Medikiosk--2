import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { logoutStaff } from "@/services/authService";
import { getAdminOverview, getAuditLog, getStaffDirectory } from "@/services/adminService";
import { qk } from "@/lib/queryClient";
import { errorMessage } from "@/services/apiClient";
import {
  ArrowLeft,
  User,
  Stethoscope,
  LogOut,
  Activity,
  Users,
  CheckCircle2,
  TriangleAlert,
  Clock,
  FileText,
  Monitor,
  ScrollText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";



const TABS = [
  { id: "overview", label: "Operations", icon: Activity },
  { id: "staff", label: "Staff", icon: Users },
  { id: "audit", label: "Audit trail", icon: ScrollText },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [auditPage, setAuditPage] = useState(1);

  const overview = useQuery({
    queryKey: qk.adminOverview(),
    queryFn: getAdminOverview,
    refetchInterval: 30_000,
  });

  const staff = useQuery({
    queryKey: qk.adminStaff(),
    queryFn: getStaffDirectory,
    enabled: tab === "staff",
  });

  const audit = useQuery({
    queryKey: qk.adminAudit(auditPage),
    queryFn: () => getAuditLog(auditPage, 20),
    enabled: tab === "audit",
  });

  const handleLogout = async () => {
    await logoutStaff();
    navigate("/");
  };

  return (
    <div className="app-ambient min-h-full">
      <header className="sticky top-0 z-30 border-b border-line bg-white/65 backdrop-blur-2xl saturate-150 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-[60px] max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="group flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-white/55 text-ink/70 transition-colors hover:border-ink/25 hover:text-ink dark:bg-white/[0.06] dark:text-zinc-300"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-[420ms] [transition-timing-function:var(--ease-glide)] group-hover:-translate-x-0.5" />
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-emerald-600 font-display text-base font-bold text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950">
              M
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold leading-none tracking-[-0.02em] text-ink md:text-lg">
                MediKiosk
              </p>
              <p className="mt-1 truncate text-sm leading-none text-zinc-500 dark:text-zinc-400">
                Hospital Administration
              </p>
            </div>
            <Badge tone="neutral" className="hidden sm:inline-flex">
              Staff
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="compact" />
            <ThemeToggle />
            <Button size="md" variant="tertiary" onClick={handleLogout} icon={<LogOut className="h-3.5 w-3.5" />}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <div className="reveal mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-4xl md:text-5xl">
              Operations
            </h1>
            <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
              Live OPD load, staff directory and the full audit trail.
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              void overview.refetch();
              if (tab === "staff") void staff.refetch();
              if (tab === "audit") void audit.refetch();
            }}
            icon={<RefreshCw className={overview.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 overflow-x-auto rounded-[12px] border border-line bg-white/60 p-1 dark:bg-white/[0.04]" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={
                "flex shrink-0 items-center gap-2 rounded-[9px] px-4 py-2.5 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 " +
                (tab === id
                  ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-ink/[0.04] hover:text-ink dark:text-zinc-300 dark:hover:bg-white/10")
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
))}
        </div>

        {/* ── Operations ─────────────────────────────────── */}
        {tab === "overview" && (
          <section aria-label="Operations overview">
            {overview.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-[104px] w-full rounded-[14px]" />
))}
              </div>
) : overview.isError ? (
              <EmptyState
                icon={<TriangleAlert className="h-6 w-6" />}
                title="Could not load operations data"
                description={errorMessage(overview.error)}
                action={<Button onClick={() => void overview.refetch()}>Try again</Button>}
              />
) : (
              overview.data && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat icon={Users} label="In queue now" value={overview.data.today.inQueue} hint="Across all doctors" />
                    <Stat icon={CheckCircle2} label="Completed today" value={overview.data.today.completedToday} hint={`${overview.data.today.throughputPct}% of tokens issued`} />
                    <Stat icon={TriangleAlert} label="Flagged findings" value={overview.data.today.flaggedToday} hint="Raised by triage rules" />
                    <Stat icon={Clock} label="Avg consultation" value={overview.data.today.avgConsultMin ? `${overview.data.today.avgConsultMin} min` : "—"} hint="From real start/end times" />
                    <Stat icon={Activity} label="Tokens issued" value={overview.data.today.issuedToday} hint={`${overview.data.today.absentToday} marked absent`} />
                    <Stat icon={User} label="Registrations" value={overview.data.today.sessionsToday} hint="Kiosk sessions today" />
                    <Stat icon={FileText} label="Documents scanned" value={overview.data.today.documentsToday} hint="Read on-device by OCR" />
                    <Stat icon={ShieldCheck} label="Charts signed" value={overview.data.today.verifiedToday} hint="Verified by a clinician" />
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                    {/* Doctor load */}
                    <Card padding="md" className="border-line bg-white/65">
                      <h2 className="font-display text-lg font-semibold text-ink">OPD load by doctor</h2>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Patients currently waiting, against the session's slot capacity.
                      </p>

                      {overview.data.load.length === 0 ? (
                        <p className="mt-5 text-base text-zinc-500 dark:text-zinc-400">
                          No doctors have patients waiting right now.
                        </p>
) : (
                        <ul className="mt-4 space-y-3">
                          {overview.data.load.map((d) => {
                            const pct = d.capacity ? Math.min(100, Math.round((d.waiting / d.capacity) * 100)) : 0;
                            return (
                              <li key={d.id}>
                                <div className="flex items-baseline justify-between gap-3">
                                  <p className="truncate text-base font-semibold text-ink">
                                    {d.name}
                                    <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">{d.department}</span>
                                  </p>
                                  <span className="shrink-0 font-mono text-sm text-zinc-600 dark:text-zinc-300">
                                    {d.waiting}/{d.capacity}
                                  </span>
                                </div>
                                <div
                                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
                                  role="progressbar"
                                  aria-valuenow={d.waiting}
                                  aria-valuemin={0}
                                  aria-valuemax={d.capacity}
                                  aria-label={`${d.name} queue load`}
                                >
                                  <div
                                    className={
                                      "h-full rounded-full transition-[width] duration-500 " +
                                      (pct > 80 ? "bg-amber-500" : "bg-emerald-600 dark:bg-emerald-500")
                                    }
                                    style={{ width: `${Math.max(pct, d.waiting > 0 ? 4 : 0)}%` }}
                                  />
                                </div>
                              </li>
);
                          })}
                        </ul>
)}
                    </Card>

                    {/* Kiosk fleet */}
                    <Card padding="md" className="border-line bg-white/65">
                      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                        <Monitor className="h-4 w-4" aria-hidden="true" />
                        Kiosk fleet
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {overview.data.totals.kiosks} terminal{overview.data.totals.kiosks === 1 ? "" : "s"} registered.
                      </p>

                      {overview.data.kiosks.length === 0 ? (
                        <p className="mt-5 text-base text-zinc-500 dark:text-zinc-400">No kiosks have checked in yet.</p>
) : (
                        <ul className="mt-4 divide-y divide-line">
                          {overview.data.kiosks.map((k) => (
                            <li key={k.id} className="flex items-center justify-between gap-3 py-2.5">
                              <div className="min-w-0">
                                <p className="truncate text-base font-medium text-ink">{k.name}</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Last active {k.lastActive}</p>
                              </div>
                              <Badge tone={k.status === "online" ? "solid" : "neutral"} mark={k.status === "online" ? "dot" : undefined}>
                                {k.status}
                              </Badge>
                            </li>
))}
                        </ul>
)}
                    </Card>
                  </div>
                </>
)
)}
          </section>
)}

        {/* ── Staff ──────────────────────────────────────── */}
        {tab === "staff" && (
          <section aria-label="Staff directory">
            {staff.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[200px] w-full rounded-[14px]" />
))}
              </div>
) : staff.isError ? (
              <EmptyState
                icon={<TriangleAlert className="h-6 w-6" />}
                title="Could not load the staff directory"
                description={errorMessage(staff.error)}
                action={<Button onClick={() => void staff.refetch()}>Try again</Button>}
              />
) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {staff.data?.map((s) => (
                    <Card key={s.id} padding="md" className="reveal border-line bg-white/65">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-ink/5 font-mono text-sm font-bold text-ink dark:bg-white/10 dark:text-white">
                          {s.initials}
                        </div>
                        <Badge tone={s.status === "Active" ? "solid" : "neutral"} mark={s.status === "Active" ? "dot" : undefined}>
                          {s.status}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <h3 className="font-display text-lg font-semibold text-ink">{s.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/65 sm:text-base">
                          <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
                          {[s.department, s.qualification].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <div className="mt-5 border-t border-line pt-4">
                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-base">
                          <dt className="text-zinc-500 dark:text-zinc-400">Role</dt>
                          <dd className="capitalize text-ink">{s.role}</dd>
                          <dt className="text-zinc-500 dark:text-zinc-400">Username</dt>
                          <dd className="font-mono text-ink">{s.username}</dd>
                          {s.room && (
                            <>
                              <dt className="text-zinc-500 dark:text-zinc-400">Room</dt>
                              <dd className="font-mono text-ink">{s.room}</dd>
                            </>
)}
                          <dt className="text-zinc-500 dark:text-zinc-400">Last sign-in</dt>
                          <dd className="text-ink">{s.lastLogin}</dd>
                        </dl>
                      </div>
                    </Card>
))}
                </div>

                {/*
                  Passwords are deliberately absent. The prototype printed working
                  credentials on this screen; they are now bcrypt hashes that no
                  endpoint returns.
                */}
                <p className="mt-5 flex items-start gap-2 rounded-[12px] border border-line bg-white/60 p-4 text-sm text-zinc-600 dark:bg-white/[0.04] dark:text-zinc-400">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>
                    Credentials are stored as bcrypt hashes and are never displayed or returned by the API. To reset a
                    password, use the server-side seed or an administrator account on the host.
                  </span>
                </p>
              </>
)}
          </section>
)}

        {/* ── Audit ──────────────────────────────────────── */}
        {tab === "audit" && (
          <section aria-label="Audit trail">
            {audit.isLoading ? (
              <Skeleton className="h-[420px] w-full rounded-[14px]" />
) : audit.isError ? (
              <EmptyState
                icon={<TriangleAlert className="h-6 w-6" />}
                title="Could not load the audit trail"
                description={errorMessage(audit.error)}
                action={<Button onClick={() => void audit.refetch()}>Try again</Button>}
              />
) : audit.data && audit.data.items.length === 0 ? (
              <EmptyState
                icon={<ScrollText className="h-6 w-6" />}
                title="No activity recorded yet"
                description="Registrations, tokens, edits and sign-offs will appear here as they happen."
              />
) : (
              audit.data && (
                <Card padding="none" className="overflow-hidden border-line bg-white/65">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left">
                      <caption className="sr-only">Audit trail of all recorded actions</caption>
                      <thead className="border-b border-line bg-ink/[0.03] dark:bg-white/[0.04]">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-zinc-600 dark:text-zinc-400">Time</th>
                          <th scope="col" className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-zinc-600 dark:text-zinc-400">Action</th>
                          <th scope="col" className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-zinc-600 dark:text-zinc-400">Actor</th>
                          <th scope="col" className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-zinc-600 dark:text-zinc-400">Entity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {audit.data.items.map((row) => (
                          <tr key={row.id} className="transition-colors hover:bg-ink/[0.02] dark:hover:bg-white/[0.03]">
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-zinc-600 dark:text-zinc-300">{row.timestamp}</td>
                            <td className="px-4 py-3 text-base text-ink">{row.action}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-base text-zinc-600 dark:text-zinc-300">{row.actor}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">{row.entity}</td>
                          </tr>
))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Page {audit.data.page} of {audit.data.totalPages} · {audit.data.total} entries
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="md"
                        variant="secondary"
                        disabled={auditPage <= 1}
                        onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                        icon={<ChevronLeft className="h-3.5 w-3.5" />}
                      >
                        Previous
                      </Button>
                      <Button
                        size="md"
                        variant="secondary"
                        disabled={auditPage >= (audit.data.totalPages ?? 1)}
                        onClick={() => setAuditPage((p) => p + 1)}
                        iconRight={<ChevronRight className="h-3.5 w-3.5" />}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </Card>
)
)}
          </section>
)}
      </main>
    </div>
);
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}




) {
  return (
    <Card padding="md" className="reveal border-line bg-white/65">
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <p className="text-sm font-semibold uppercase tracking-[0.05em]">{label}</p>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-[-0.02em] text-ink">{value}</p>
      {hint && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </Card>
);
}
