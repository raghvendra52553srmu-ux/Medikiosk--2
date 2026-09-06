import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { getPatientChart, patientInitials, updateChartSummary, verifyChart } from "@/services/chartService";
import { errorMessage } from "@/services/apiClient";
import { qk } from "@/lib/queryClient";

import { cn } from "@/utils/cn";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Clock, FileText, FlaskConical,
  History, Layers, PencilLine, ShieldCheck,
} from "lucide-react";



export default function PatientDetail() {
  // The route param is the token id — the same handle the queue board uses.
  const { patientId: tokenId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("summary");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [openSections, setOpenSections] = useState(
    new Set(["complaint", "hpi", "medications", "flags"])
);

  const {
    data: chart,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.chart(tokenId ?? "none"),
    queryFn: () => getPatientChart(tokenId),
    enabled: Boolean(tokenId),
  });

  const token = chart?.token ?? null;
  const summary = chart?.summary ?? null;
  const docs = chart?.documents ?? [];
  const timeline = chart?.timeline ?? [];
  const labs = chart?.labs ?? [];
  const audit = chart?.audit ?? [];
  const isLive = (chart?.documents.length ?? 0) > 0 || Object.keys(chart?.answers ?? {}).length > 0;

  const verified = summary?.status === "verified";
  const verifiedAt = summary?.verifiedAt ?? "";
  const abnormal = useMemo(() => labs.filter(l => l.status !== "normal"), [labs]);

  /** Maps a UI section key onto the field the API stores. */
  const FIELD_OF = {
    complaint: "chiefComplaint",
    hpi: "historyOfPresentIllness",
    past: "pastMedicalHistory",
    medications: "medications",
    allergies: "allergies",
    family: "familyHistory",
    social: "socialHistory",
    ros: "reviewOfSystems",
  };

  const saveSection = useMutation({
    mutationFn: ({ key, value }) => {
      const field = FIELD_OF[key];
      // Medications and allergies are lists in the model; one entry per line.
      const payload =
        field === "medications" || field === "allergies"
          ? { [field]: value.split("\n").map(v => v.trim()).filter(Boolean) }
          : { [field]: value };
      return updateChartSummary(tokenId, payload);
    },
    onSuccess: (_data, { key }) => {
      setEditing(null);
      toast("Section updated.", { detail: `Your edit to ${key} is recorded in the audit trail.` });
      void queryClient.invalidateQueries({ queryKey: qk.chart(tokenId) });
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: (err) => toast(errorMessage(err), { tone: "flag" }),
  });

  const sign = useMutation({
    mutationFn: () => verifyChart(tokenId),
    onSuccess: () => {
      setConfirmOpen(false);
      toast("Summary verified and signed.", { detail: "Recorded against your account." });
      void queryClient.invalidateQueries({ queryKey: qk.chart(tokenId) });
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
    onError: (err) => {
      setConfirmOpen(false);
      toast(errorMessage(err), { tone: "flag" });
    },
  });

  if (loading) {
    return (
      <DoctorLayout>
        <div className="mx-auto max-w-[1400px] space-y-3">
          <Skeleton className="h-[132px] w-full rounded-[14px]" />
          <Skeleton className="h-[320px] w-full rounded-[14px]" />
        </div>
      </DoctorLayout>
);
  }

  if (isError || !token || !summary) {
    return (
      <DoctorLayout>
        <EmptyState
          tone="alert"
          icon={<FileText className="h-5 w-5" />}
          title="Patient file unavailable"
          description={
            errorMessage(error) ||
            "This token is not in today's queue. Go back and pick a patient from the list."
          }
          action={<Button size="md" onClick={() => navigate("/doctor/queue")}>Back to queue</Button>}
          secondaryAction={<Button size="md" variant="secondary" onClick={() => void refetch()}>Try again</Button>}
        />
      </DoctorLayout>
);
  }

  // Values come straight from the server; a saved edit is reflected on refetch,
  // so there is no local copy that can drift from the signed record.
  const valueFor = (_key, fallback) => fallback;
  const edits = {};

  const toggle = (key) =>
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const saveEdit = (key) => saveSection.mutate({ key, value: draft });

  const sections = [
    { key: "complaint", label: "Chief complaint", value: valueFor("complaint", summary.chiefComplaint) },
    { key: "hpi", label: "History of present illness", value: valueFor("hpi", summary.historyOfPresentIllness) },
    { key: "past", label: "Past history", value: valueFor("past", summary.pastMedicalHistory) },
    { key: "medications", label: "Medications", value: valueFor("medications", summary.medications.join("\n")) },
    { key: "allergies", label: "Allergies", value: valueFor("allergies", summary.allergies.join(", ")) },
    { key: "family", label: "Family history", value: valueFor("family", summary.familyHistory) },
    { key: "social", label: "Social history", value: valueFor("social", summary.socialHistory) },
    { key: "ros", label: "Review of systems", value: valueFor("ros", summary.reviewOfSystems) },
  ];

  const tabs = [
    { key: "summary", label: "Draft summary" },
    { key: "records", label: "Documents", count: docs.length },
    { key: "timeline", label: "Timeline", count: timeline.length },
    { key: "labs", label: "Lab results", count: labs.length },
    { key: "audit", label: "Audit trail", count: audit.length },
  ];

  return (
    <DoctorLayout>
      <div className="mx-auto max-w-[1400px]">
        <button
          onClick={() => navigate("/doctor/queue")}
          className="group mb-3 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-base text-ink/55 transition-colors hover:bg-ink/[0.05] hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-[420ms] [transition-timing-function:var(--ease-glide)] group-hover:-translate-x-0.5" />
          Queue
        </button>

        {/* Sticky snapshot header */}
        <header className="glass-strong sticky top-[60px] z-20 mb-4 rounded-[15px]">
          <div className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg font-semibold text-white">
              {patientInitials(token.patientName)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl font-semibold leading-tight tracking-[-0.025em] text-ink">
                  {token.patientName}
                </h1>
                <span className="tabular rounded-md bg-ink/[0.07] px-2 py-0.5 font-mono text-sm sm:text-base font-semibold text-ink">
                  {token.number}
                </span>
                <span className="tabular text-sm sm:text-base text-ink/55">{token.age} yrs / {token.sex}</span>
              </div>
              <p className="mt-1 text-base text-ink/55">
                {token.department} · {token.hospitalName} · token issued {token.generatedAt}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {isLive ? (
                <Badge tone="solid" mark="dot">Kiosk session</Badge>
) : (
                <Badge tone="quiet" mark="ring">Counter / queue only</Badge>
)}
              {verified ? (
                <Badge tone="done" mark="dot"><ShieldCheck className="h-3 w-3" />Verified by you</Badge>
) : (
                <Badge tone="flag" mark="ring">Awaiting your sign-off</Badge>
)}
            </div>
          </div>

          <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Giving history for", v: valueFor("complaint", summary.chiefComplaint) },
              { k: "Allergies", v: valueFor("allergies", summary.allergies.join(", ")) },
              { k: "On treatment", v: summary.medications[0] ?? "None reported" },
              { k: "Needs your eye", v: `${summary.redFlags.length + abnormal.length} item${summary.redFlags.length + abnormal.length === 1 ? "" : "s"} flagged` },
            ].map(cell => (
              <div key={cell.k} className="bg-white/70 px-4 py-3">
                <p className="text-sm uppercase tracking-[0.12em] text-ink/60">{cell.k}</p>
                <p className="mt-1 line-clamp-2 text-base leading-snug text-ink">{cell.v}</p>
              </div>
))}
          </div>
        </header>

        {/* Tabs */}
        <div className="relative mb-4 flex gap-1 overflow-x-auto border-b border-line">
          {tabs.map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                "relative whitespace-nowrap px-3.5 py-2.5 text-base transition-colors duration-300 [transition-timing-function:var(--ease-glide)]",
                tab === item.key ? "font-medium text-ink" : "text-ink/60 hover:text-ink/80"
)}
              aria-current={tab === item.key ? "true" : undefined}
            >
              {item.label}
              {item.count !== undefined && (
                <span className="tabular ml-1.5 text-sm text-ink/60">{item.count}</span>
)}
              <span
                className={cn(
                  "absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-ink transition-transform duration-[420ms] [transition-timing-function:var(--ease-spring)]",
                  tab === item.key ? "scale-x-100" : "scale-x-0"
)}
              />
            </button>
))}
        </div>

        {tab === "summary" && (
          <div className="grid gap-4 lg:grid-cols-[1fr_290px]">
            <div className="space-y-2.5">
              {sections.map(section => {
                const open = openSections.has(section.key);
                const dirty = edits[section.key] !== undefined;
                return (
                  <Card key={section.key} padding="none" className={cn("overflow-hidden border-line bg-white/55", dirty && "border-ink/30")}>
                    <div className="flex items-center gap-2 px-4 py-2.5">
                      <button
                        onClick={() => toggle(section.key)}
                        aria-expanded={open}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300",
                          dirty ? "bg-ink" : open ? "bg-ink/45" : "bg-ink/15"
)} />
                        <span className="font-display text-base font-semibold tracking-[-0.015em] text-ink">
                          {section.label}
                        </span>
                        {dirty && <Badge tone="neutral">Modified by you</Badge>}
                      </button>
                      {editing !== section.key && (
                        <Button
                          size="sm"
                          variant="tertiary"
                          onClick={() => { setEditing(section.key); setDraft(section.value); setOpenSections(p => new Set(p).add(section.key)); }}
                          icon={<PencilLine className="h-3.5 w-3.5" />}
                        >
                          Edit
                        </Button>
)}
                    </div>

                    {open && (
                      <div className="border-t border-line/80 px-4 py-3.5">
                        {editing === section.key ? (
                          <>
                            <Textarea
                              label={`Revise — ${section.label}`}
                              helperText="Your edit replaces the draft text and is recorded under your name in the audit trail."
                              value={draft}
                              onChange={e => setDraft(e.target.value)}
                              className="min-h-[140px]"
                            />
                            <div className="mt-2.5 flex gap-2">
                              <Button size="md" onClick={() => saveEdit(section.key)} disabled={saveSection.isPending}>
                                {saveSection.isPending ? "Saving…" : "Save as my edit"}
                              </Button>
                              <Button size="md" variant="tertiary" onClick={() => setEditing(null)}>Cancel</Button>
                            </div>
                          </>
) : (
                          <>
                            <p className="whitespace-pre-line text-base leading-relaxed text-ink/85">{section.value}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <SourceBadge source={dirty ? "clinician-verified" : "system-compiled"} />
                              {!dirty && (
                                <span className="text-sm text-ink/60">
                                  Compiled from kiosk answers and {docs.length} documents · {summary.compiledAt}
                                </span>
)}
                            </div>
                          </>
)}
                      </div>
)}
                  </Card>
);
              })}
            </div>

            <aside className="space-y-3">
              <Card padding="none" className="overflow-hidden border-ink/25 bg-white/75">
                <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-ink" />
                  <h2 className="font-display text-base font-semibold tracking-[-0.015em] text-ink">
                    Needs attention
                  </h2>
                  <Badge tone="neutral" className="ml-auto">{summary.redFlags.length + abnormal.length}</Badge>
                </div>
                <ul className="divide-y divide-line">
                  {summary.redFlags.map(rf => (
                    <li key={rf.id} className="px-4 py-3">
                      <p className="text-base font-medium leading-snug text-ink">{rf.finding}</p>
                      <p className="mt-1 text-sm sm:text-base leading-relaxed text-ink/60">{rf.reason}</p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-ink/60">
                        <SourceBadge source={rf.source} /> · {rf.timestamp}
                      </p>
                    </li>
))}
                  {abnormal.map(l => (
                    <li key={l.test} className="px-4 py-3">
                      <p className="text-base font-medium text-ink">
                        {l.test} {l.result} <span className="font-normal text-ink/60">(ref {l.referenceRange})</span>
                      </p>
                      <p className="mt-1 text-sm sm:text-base leading-relaxed text-ink/60">
                        Outside the reference range on the attached report.
                      </p>
                    </li>
))}
                </ul>
                <p className="border-t border-line bg-ink/[0.03] px-4 py-2.5 text-sm leading-relaxed text-ink/55">
                  These are pointers from the source data, not conclusions. Nothing here is added to the notes until you sign off.
                </p>
              </Card>

              <Card padding="none" className="overflow-hidden border-line bg-white/55">
                <div className="border-b border-line px-4 py-3">
                  <h2 className="font-display text-base font-semibold tracking-[-0.015em] text-ink">Sign-off</h2>
                </div>
                {verified ? (
                  <div className="space-y-2 px-4 py-4">
                    <p className="flex items-center gap-2 text-base font-medium text-ink">
                      <ShieldCheck className="h-4 w-4" />Verified by Dr. Sunita Patil
                    </p>
                    <p className="tabular text-sm text-ink/60">{verifiedAt}</p>
                    <p className="pt-1 text-sm leading-relaxed text-ink/55">
                      {Object.keys(edits).length > 0
                        ? `${Object.keys(edits).length} section${Object.keys(edits).length === 1 ? "" : "s"} modified by you before verification.`
                        : "Draft accepted as written."}
                    </p>
                    <Button size="sm" variant="tertiary" disabled title="A signed chart is immutable; add an addendum instead." onClick={() => toast("A signed chart cannot be withdrawn.", { tone: "flag", detail: "Record any change as a new note in the room." })}>
                      Withdraw sign-off
                    </Button>
                  </div>
) : (
                  <div className="px-4 py-4">
                    <p className="text-sm sm:text-base leading-relaxed text-ink/60">
                      Review each section, edit what is wrong, then confirm. The confirmed text becomes the visit note.
                    </p>
                    <Button size="md" className="mt-3 w-full" onClick={() => setConfirmOpen(true)} icon={<ShieldCheck className="h-4 w-4" />}>
                      Verify summary
                    </Button>
                  </div>
)}
              </Card>

              <Card padding="md" className="border-line bg-white/45">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                  <Layers className="h-3.5 w-3.5 text-ink/60" />Provenance on this file
                </h2>
                <ul className="mt-2.5 space-y-2">
                  {(["patient-stated", "document", "system-compiled", "clinician-verified"]).map(s => (
                    <li key={s} className="flex items-center justify-between gap-2">
                      <SourceBadge source={s} />
                      <span className="text-sm text-ink/60">
                        {s === "patient-stated" ? "kiosk answers"
                          : s === "document" ? `${docs.length} scanned`
                          : s === "system-compiled" ? "unverified draft"
                          : verified ? "signed off" : "not yet"}
                      </span>
                    </li>
))}
                </ul>
              </Card>
            </aside>
          </div>
)}

        {tab === "records" && (
          docs.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="No records added at the kiosk"
              description="The patient continued without papers. You can still see their answers, and request records here."
              action={<Button size="md" variant="secondary">Request from desk</Button>}
            />
) : (
            <div className="grid gap-2.5 md:grid-cols-2">
              {docs.map((doc, i) => (
                <Card key={doc.id} padding="md" className="reveal border-line bg-white/55" style={{ ["--i" ]: i }}>
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-16 w-12 shrink-0 items-center justify-center rounded-[7px] border border-line-strong bg-[#fbfbfa] text-ink/60">
                      <FileText className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-ink">{doc.name}</p>
                      <p className="mt-0.5 text-sm text-ink/60">{doc.date} · {doc.type.replace("-", " ")}</p>
                      {doc.extractedInfo && (
                        <p className="mt-2 rounded-[8px] border border-line bg-white/70 px-2.5 py-2 text-sm sm:text-base leading-relaxed text-ink/75">
                          {doc.extractedInfo}
                        </p>
)}
                      <div className="mt-2 flex items-center gap-2">
                        <SourceBadge source={doc.source} />
                        <Button size="sm" variant="tertiary">Original</Button>
                      </div>
                    </div>
                  </div>
                </Card>
))}
            </div>
)
)}

        {tab === "timeline" && (
          timeline.length === 0 ? (
            <EmptyState
              icon={<History className="h-5 w-5" />}
              title="No previous medical events"
              description="Nothing was readable from the attached records that could be placed on a timeline."
            />
) : (
            <Card padding="md" className="border-line bg-white/55">
              <ol className="relative">
                {timeline.map((event, i) => (
                  <li key={event.id} className="flex gap-4 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className={cn(
                        "mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2",
                        event.type === "investigation" ? "border-ink bg-white"
                          : event.type === "prescription" ? "border-ink/45 bg-ink/45"
                          : "border-ink bg-ink"
)} />
                      {i < timeline.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="tabular flex flex-wrap items-center gap-2 text-sm text-ink/60">
                        {new Date(event.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        <span className="rounded border border-line px-1.5 py-px text-sm uppercase tracking-[0.08em]">{event.type}</span>
                        <SourceBadge source={event.source} />
                      </p>
                      <p className="mt-1 text-base font-medium text-ink">{event.title}</p>
                      <p className="mt-1 max-w-2xl text-base leading-relaxed text-ink/65">{event.description}</p>
                      {(event.doctor || event.facility) && (
                        <p className="mt-1 text-sm text-ink/60">
                          {[event.doctor, event.facility].filter(Boolean).join(" · ")}
                        </p>
)}
                    </div>
                  </li>
))}
              </ol>
            </Card>
)
)}

        {tab === "labs" && (
          <div className="glass overflow-hidden rounded-[14px]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <caption className="sr-only">Investigation results extracted from uploaded reports</caption>
                <thead>
                  <tr className="border-b border-line bg-ink/[0.03] text-sm uppercase tracking-[0.12em] text-ink/60">
                    <th scope="col" className="px-4 py-2.5 font-semibold">Test</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Result</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Reference</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Flag</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {labs.map(l => (
                    <tr key={l.test} className={cn(
                      "border-b border-line/70 transition-colors duration-300 last:border-0 hover:bg-white/80",
                      l.status !== "normal" && "bg-ink/[0.035]"
)}>
                      <th scope="row" className="px-4 py-3 text-left text-base font-medium text-ink">{l.test}</th>
                      <td className={cn("tabular px-4 py-3 font-mono text-base", l.status === "normal" ? "text-ink/80" : "font-semibold text-ink")}>
                        {l.result}
                      </td>
                      <td className="tabular px-4 py-3 text-base text-ink/55">{l.referenceRange}</td>
                      <td className="px-4 py-3">
                        {l.status === "normal" ? (
                          <span className="text-sm sm:text-base text-ink/60">In range</span>
) : (
                          <Badge tone="flag">
                            {l.status === "high" ? "Above range" : l.status === "low" ? "Below range" : "Critical"}
                          </Badge>
)}
                      </td>
                      <td className="px-4 py-3"><SourceBadge source={l.source} /></td>
                    </tr>
))}
                </tbody>
              </table>
            </div>
            <p className="flex items-center gap-2 border-t border-line bg-ink/[0.02] px-4 py-2.5 text-sm text-ink/55">
              <FlaskConical className="h-3.5 w-3.5" />
              Values transcribed from a scanned report. Verify against the original before acting on them.
            </p>
          </div>
)}

        {tab === "audit" && (
          <Card padding="none" className="overflow-hidden border-line bg-white/55">
            <ul className="divide-y divide-line/80">
              {audit.map(entry => (
                <li key={entry.id} className="grid grid-cols-[92px_1fr_auto] items-center gap-3 px-4 py-2.5 text-base transition-colors duration-300 hover:bg-white/75">
                  <span className="tabular font-mono text-sm text-ink/60">{entry.timestamp}</span>
                  <span className="text-ink">{entry.action}</span>
                  <span className="text-sm uppercase tracking-[0.1em] text-ink/60">{entry.actor}</span>
                </li>
))}
              {Object.keys(edits).length > 0 && (
                <li className="grid grid-cols-[92px_1fr_auto] items-center gap-3 bg-ink/[0.03] px-4 py-2.5 text-base">
                  <span className="tabular flex items-center gap-1 font-mono text-sm text-ink/60"><Clock className="h-3 w-3" />now</span>
                  <span className="text-ink">Doctor edited {Object.keys(edits).length} section(s) of the draft</span>
                  <span className="text-sm uppercase tracking-[0.1em] text-ink/60">Dr. Patil</span>
                </li>
)}
              {verified && (
                <li className="grid grid-cols-[92px_1fr_auto] items-center gap-3 bg-ink/[0.05] px-4 py-2.5 text-base">
                  <span className="tabular font-mono text-sm text-ink/60">{verifiedAt.replace(/^[^·]+\s/, "")}</span>
                  <span className="flex items-center gap-1.5 font-medium text-ink"><CheckCircle2 className="h-3.5 w-3.5" />Summary verified</span>
                  <span className="text-sm uppercase tracking-[0.1em] text-ink/60">Dr. Patil</span>
                </li>
)}
            </ul>
          </Card>
)}
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm this as the visit note?"
        description="The draft was written by the kiosk from the patient's answers and their uploaded reports. Once you verify it, it is recorded as reviewed by you."
      >
        <div className="rounded-[11px] border border-line bg-white/60 p-3.5">
          <p className="text-sm sm:text-base leading-relaxed text-ink/70">
            {Object.keys(edits).length > 0
              ? `${Object.keys(edits).length} section(s) already edited by you.`
              : "You have not edited any section. Verified text will match the compiled draft exactly."}
          </p>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="tertiary" size="lg" onClick={() => setConfirmOpen(false)}>Keep reviewing</Button>
          <Button
            size="lg"
            data-autofocus
            icon={<ShieldCheck className="h-4 w-4" />}
            disabled={sign.isPending}
            onClick={() => sign.mutate()}
          >
            {sign.isPending ? "Signing…" : "Verify & sign"}
          </Button>
        </div>
      </Dialog>
    </DoctorLayout>
);
}
