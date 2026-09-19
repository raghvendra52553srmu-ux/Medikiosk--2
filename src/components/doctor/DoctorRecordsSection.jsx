import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/utils/cn";
import {
  Calendar, CheckCircle2, Clock, Eye, FileText, Filter,
  FlaskConical, History, Layers, RefreshCw, Search, ShieldCheck,
  Stethoscope, User, Users, X
} from "lucide-react";

export function DoctorRecordsSection({
  records,
  loading,
  timeframe,
  setTimeframe,
  category,
  setCategory,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("consultations"); // consultations | documents | queue | revenue
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const metrics = records?.metrics ?? {
    totalPatients: 0,
    todayPatients: 0,
    completedConsultations: 0,
    pendingPatients: 0,
    followUpPatients: 0,
  };

  const consultations = records?.consultations ?? [];
  const documents = records?.documents ?? [];
  const queueRecords = records?.queueRecords ?? [];
  const serviceRevenue = records?.serviceRevenue ?? [];
  const professionalRevenue = records?.professionalRevenue ?? [];
  const totalProfessionalRecorded = records?.totalProfessionalRecorded ?? 0;

  // Filter consultations by search query if any
  const filteredConsultations = consultations.filter(
    (c) =>
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.problem.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="mt-8 border-t border-line pt-6" id="records">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">
              Doctor Records
            </h2>
            <Badge tone="neutral">Verified Database Records</Badge>
          </div>
          <p className="mt-1 text-sm sm:text-base text-ink/60">
            Real clinical consultations, uploaded patient records, queue analytics, and recorded revenue.
          </p>
        </div>

        {/* Global Record Filters: Timeframe & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-[10px] border border-line bg-white/70 dark:bg-zinc-900/80 p-0.5 shadow-xs">
            {[
              { id: "today", label: "Today" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
              { id: "all", label: "All" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={cn(
                  "rounded-[8px] px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-150",
                  timeframe === t.id
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                    : "text-ink/65 hover:text-ink hover:bg-ink/[0.04]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            icon={<RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 1. PATIENT RECORDS SUMMARY (5 Real Counts) */}
      <div className="mb-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Patients", val: metrics.totalPatients, sub: "Lifetime in roster" },
          { label: "Today's Patients", val: metrics.todayPatients, sub: "Registered today" },
          { label: "Completed", val: metrics.completedConsultations, sub: "Consultations done" },
          { label: "Pending Patients", val: metrics.pendingPatients, sub: "In queue / waiting" },
          { label: "Follow-up Patients", val: metrics.followUpPatients, sub: "Signed / follow-up" },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-[12px] border border-line bg-white/65 dark:bg-zinc-900/60 p-3.5 backdrop-blur shadow-xs"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{item.label}</p>
            <p className="mt-1.5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              {loading ? "..." : item.val}
            </p>
            <p className="mt-0.5 text-xs text-ink/50">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Record Category Nav Tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "consultations", label: "Consultation Records", count: consultations.length, icon: Stethoscope },
            { id: "documents", label: "Document Records (OCR)", count: documents.length, icon: FileText },
            { id: "queue", label: "Queue Records", count: queueRecords.length, icon: Clock },
            { id: "revenue", label: "Revenue & Service Records", count: serviceRevenue.length, icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-[9px] px-3 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer",
                activeTab === tab.id
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                  : "text-ink/65 hover:bg-ink/[0.05] hover:text-ink"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-xs",
                  activeTab === tab.id ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900" : "bg-ink/10 text-ink/70"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Category Filters when in Revenue tab */}
        {activeTab === "revenue" && (
          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-ink/50 mr-1">Service Type:</span>
            {["all", "consultation", "lab"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-[6px] px-2 py-1 font-medium capitalize transition-colors",
                  category === c
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold"
                    : "border border-line hover:bg-ink/[0.04] text-ink/70"
                )}
              >
                {c === "all" ? "All Services" : c === "consultation" ? "Consultations" : "Lab / Diagnostics"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── TAB 1: CONSULTATION RECORDS ─────────────────────── */}
      {activeTab === "consultations" && (
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <SectionHeading title="Consultation History" meta="Real patient visits & clinical notes" />
            </div>
            <div className="relative w-full max-w-xs sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink/40" />
              <input
                type="text"
                placeholder="Search patient, token, problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[8px] border border-line bg-white dark:bg-zinc-950 py-1.5 pl-8 pr-3 text-xs placeholder:text-ink/40 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base font-semibold text-ink">No consultation records available.</p>
              <p className="mt-1 text-sm text-ink/55">
                No patients match the current timeframe filter. When tokens are registered or completed, they appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-line bg-zinc-50/70 dark:bg-zinc-900/60 text-ink/60 uppercase font-semibold text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Token & Date</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Problem</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Doctor Notes / Intake</th>
                    <th className="px-4 py-3">Follow-up</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredConsultations.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-ink">{c.tokenNumber}</span>
                        <p className="text-xs text-ink/50 mt-0.5">{c.date}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-ink">{c.patientName}</span>
                        <p className="text-xs text-ink/50">
                          {c.age} y/o · {c.sex} · ****{c.mobileLast4}
                        </p>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate">
                        <span className="font-medium text-ink">{c.problem}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          tone={
                            c.rawStatus === "COMPLETED"
                              ? "done"
                              : c.rawStatus === "IN_CONSULTATION"
                              ? "solid"
                              : c.rawStatus === "CALLED"
                              ? "flag"
                              : "neutral"
                          }
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-xs text-ink/75 line-clamp-2">{c.doctorNotes}</p>
                        {c.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            <ShieldCheck className="h-3 w-3" /> Signed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.followUpDate ? (
                          <span className="font-medium text-ink">{c.followUpDate}</span>
                        ) : (
                          <span className="text-ink/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedPatient(c)}
                        >
                          Quick View
                        </Button>
                        <Button
                          size="sm"
                          variant="tertiary"
                          onClick={() => navigate(`/doctor/patient/${c.tokenId}`)}
                        >
                          Open Chart
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 2: DOCUMENT RECORDS (OCR) ─────────────────────── */}
      {activeTab === "documents" && (
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-line px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/40">
            <SectionHeading
              title="Scanned Documents & OCR Data"
              meta="Extracted in-browser via Tesseract OCR without transmitting image PHI"
            />
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base font-semibold text-ink">No document records available.</p>
              <p className="mt-1 text-sm text-ink/55">
                No patient reports or prescriptions were uploaded in this timeframe.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col justify-between rounded-[12px] border border-line bg-white/70 dark:bg-zinc-900/70 p-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge tone="neutral" className="capitalize">
                          {d.type.replace(/_/g, " ").toLowerCase()}
                        </Badge>
                        <h4 className="mt-1.5 font-semibold text-base text-ink line-clamp-1">
                          {d.documentName}
                        </h4>
                        <p className="text-xs text-ink/55">
                          Patient: <span className="font-medium text-ink">{d.patientName}</span> ({d.tokenNumber})
                        </p>
                      </div>
                      <span className="text-xs text-ink/45 whitespace-nowrap">{d.date}</span>
                    </div>

                    {/* OCR Text Box */}
                    <div className="mt-3 rounded-[8px] border border-line/70 bg-zinc-50/90 dark:bg-zinc-950/60 p-2.5">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-ink/45 mb-1">
                        OCR Extracted Content
                      </p>
                      <p className="font-mono text-xs text-ink/80 line-clamp-3 leading-relaxed">
                        {d.extractedText}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-line pt-2.5 text-xs text-ink/55">
                    <span>
                      Confidence:{" "}
                      <strong className="text-ink">
                        {d.ocrConfidence ? `${d.ocrConfidence}%` : "Processed"}
                      </strong>
                    </span>
                    <Button
                      size="sm"
                      variant="tertiary"
                      onClick={() => navigate(`/doctor/patient/${d.tokenId}?tab=records`)}
                    >
                      View Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 3: QUEUE RECORDS ──────────────────────────────── */}
      {activeTab === "queue" && (
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-line px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/40">
            <SectionHeading
              title="OPD Queue Register"
              meta="Sequential token distribution, wait times, and consultation progression"
            />
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : queueRecords.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base font-semibold text-ink">No queue records available.</p>
              <p className="mt-1 text-sm text-ink/55">
                No tokens have been issued in the selected timeframe.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-line bg-zinc-50/70 dark:bg-zinc-900/60 text-ink/60 uppercase font-semibold text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Token #</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Queue Status</th>
                    <th className="px-4 py-3">Waiting Time</th>
                    <th className="px-4 py-3">Consultation Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {queueRecords.map((q) => (
                    <tr key={q.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-ink">
                        {q.tokenNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">{q.patientName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge tone="neutral" className="capitalize">
                          {q.status.toLowerCase().replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink/70">
                        {q.waitingTimeMin} min wait
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          tone={
                            q.consultationStatus === "Completed"
                              ? "done"
                              : q.consultationStatus === "In Room"
                              ? "solid"
                              : "neutral"
                          }
                        >
                          {q.consultationStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="tertiary"
                          onClick={() => navigate(`/doctor/patient/${q.tokenId}`)}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 4: REVENUE & SERVICE RECORDS (Sections 3 & 4) ─── */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          {/* Section 4: Professional Revenue Records */}
          <Card padding="none" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 bg-zinc-50/50 dark:bg-zinc-900/40">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Professional Revenue Records</h3>
                <p className="text-xs text-ink/55 mt-0.5">
                  Legitimate recorded clinician compensation from performed consultations and review services.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-ink/50 uppercase font-semibold">Total Recorded</span>
                <p className="font-display text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{totalProfessionalRecorded}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : professionalRevenue.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-base font-semibold text-ink">No revenue records available.</p>
                <p className="mt-1 text-sm text-ink/55">
                  No completed consultations or billable services recorded for this timeframe.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-line bg-zinc-50/70 dark:bg-zinc-900/60 text-ink/60 uppercase font-semibold text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Gross Amount</th>
                      <th className="px-4 py-3">Doctor Share</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {professionalRevenue.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-ink font-medium">{r.date}</td>
                        <td className="px-4 py-3 font-semibold text-ink">{r.service}</td>
                        <td className="px-4 py-3 text-ink/80">{r.patient}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-medium text-ink">
                          ₹{r.grossAmount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{r.doctorShare}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Badge tone="done">{r.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Section 3: Hospital Service & Diagnostic Revenue Record */}
          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-line px-5 py-3.5 bg-zinc-50/50 dark:bg-zinc-900/40">
              <h3 className="font-display text-lg font-bold text-ink">Hospital Service & Diagnostic Records</h3>
              <p className="text-xs text-ink/55 mt-0.5">
                Transparent revenue distribution across hospital facility, platform infrastructure, and professional review.
              </p>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : serviceRevenue.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-base font-semibold text-ink">No service revenue records available.</p>
                <p className="mt-1 text-sm text-ink/55">
                  No diagnostic or hospital services recorded under this filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-line bg-zinc-50/70 dark:bg-zinc-900/60 text-ink/60 uppercase font-semibold text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Gross</th>
                      <th className="px-4 py-3">Hospital Share</th>
                      <th className="px-4 py-3">Platform Share</th>
                      <th className="px-4 py-3">Doctor Incentive/Share</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {serviceRevenue.map((sr) => (
                      <tr key={sr.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-ink">{sr.service}</td>
                        <td className="px-4 py-3 text-ink/80">{sr.patient}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-ink/70">{sr.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-ink">
                          ₹{sr.amount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-ink/80">
                          ₹{sr.hospitalShare}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-ink/60">
                          ₹{sr.platformShare}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{sr.doctorShare}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Badge tone="done">{sr.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Regulatory & Ethical Compliance Notice */}
            <div className="border-t border-line bg-zinc-50/60 dark:bg-zinc-900/50 p-4 text-xs text-ink/60 leading-relaxed">
              <p className="font-semibold text-ink">Important Regulatory & Ethical Policy Note:</p>
              <p className="mt-0.5">
                Financial share breakdowns are proposed demo allocations compliant with standard hospital policy.
                Doctor incentives represent administrative and clinical oversight fees, and must never serve as referral commissions
                or inducements for test ordering under applicable healthcare regulations.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── 6. PATIENT RECORD DETAIL MODAL ────────────────────── */}
      <Dialog
        open={selectedPatient !== null}
        onClose={() => setSelectedPatient(null)}
        title={selectedPatient ? `Patient Record · ${selectedPatient.patientName}` : "Patient Record"}
        description={selectedPatient ? `Token #${selectedPatient.tokenNumber} · ${selectedPatient.date}` : ""}
        className="max-w-2xl"
      >
        {selectedPatient && (
          <div className="space-y-4 text-xs sm:text-sm text-ink max-h-[75vh] overflow-y-auto pr-1">
            {/* 1. Basic Information */}
            <div className="rounded-[10px] border border-line bg-zinc-50/80 dark:bg-zinc-900/60 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2">
                1. Patient Basic Information
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-ink/50 text-xs block">Full Name</span>
                  <strong className="text-ink">{selectedPatient.patientName}</strong>
                </div>
                <div>
                  <span className="text-ink/50 text-xs block">Age & Sex</span>
                  <strong className="text-ink">{selectedPatient.age} yrs / {selectedPatient.sex}</strong>
                </div>
                <div>
                  <span className="text-ink/50 text-xs block">Mobile (Last 4)</span>
                  <strong className="font-mono text-ink">******{selectedPatient.mobileLast4}</strong>
                </div>
                <div>
                  <span className="text-ink/50 text-xs block">Token Status</span>
                  <Badge tone="neutral">{selectedPatient.status}</Badge>
                </div>
              </div>
            </div>

            {/* 2. Problem & Chief Complaint */}
            <div className="rounded-[10px] border border-line p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-1">
                2. Problem & Chief Complaint
              </p>
              <p className="font-medium text-ink leading-relaxed">{selectedPatient.problem}</p>
            </div>

            {/* 3. History & Interview Status */}
            <div className="rounded-[10px] border border-line p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-1">
                3. Medical History
              </p>
              <p className="text-xs text-ink/75 leading-relaxed">
                {selectedPatient.answeredCount > 0
                  ? `${selectedPatient.answeredCount} intake questions completed at the kiosk.`
                  : "Walk-in intake without extended questionnaire."}
              </p>
            </div>

            {/* 4. Previous Visits & Timeline */}
            <div className="rounded-[10px] border border-line p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-1">
                4. Previous Visits
              </p>
              <p className="text-xs text-ink/60">
                Service Date: {selectedPatient.serviceDate} · Facility: {selectedPatient.hospitalName} ({selectedPatient.department})
              </p>
            </div>

            {/* 5. Uploaded Documents & OCR Information */}
            <div className="rounded-[10px] border border-line p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-1">
                5. Uploaded Documents & OCR Information
              </p>
              <p className="text-xs text-ink/75">
                {selectedPatient.documentsCount > 0
                  ? `${selectedPatient.documentsCount} document(s) uploaded and processed through client-side OCR.`
                  : "No documents attached to this visit."}
              </p>
            </div>

            {/* 6. Consultation Notes */}
            <div className="rounded-[10px] border border-line p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-1">
                6. Consultation Notes
              </p>
              <p className="text-xs font-medium text-ink leading-relaxed">
                {selectedPatient.doctorNotes}
              </p>
            </div>

            {/* 7. Follow-up & Plan */}
            <div className="rounded-[10px] border border-line p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-1">
                7. Follow-up
              </p>
              <p className="text-xs text-ink/75">
                {selectedPatient.followUpDate
                  ? `Scheduled Follow-up Date: ${selectedPatient.followUpDate}`
                  : "No mandatory follow-up scheduled for this visit."}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button variant="secondary" size="md" onClick={() => setSelectedPatient(null)}>
                Close
              </Button>
              <Button
                size="md"
                onClick={() => {
                  const id = selectedPatient.tokenId;
                  setSelectedPatient(null);
                  navigate(`/doctor/patient/${id}`);
                }}
              >
                Open Full Chart & Edit Notes
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
