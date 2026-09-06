import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { useToast } from "@/components/ui/Toast";
import { getClinicalSummary, getDocuments, getToken, submitToDoctor } from "@/services/patientService";
import { errorMessage } from "@/services/apiClient";
import { EmptyState } from "@/components/ui/EmptyState";

import { ArrowRight, CheckCircle2, FileText, Layers, PencilLine, TriangleAlert } from "lucide-react";

export default function ReviewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [summary, setSummary] = useState(null);
  const [docs, setDocs] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getClinicalSummary(), getDocuments(), getToken()])
      .then(([s, d, t]) => {
        if (!alive) return;
        setSummary(s); setDocs(d); setToken(t); setLoading(false);
      })
      .catch(err => {
        if (!alive) return;
        setLoadError(errorMessage(err));
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  if (loadError) {
    return (
      <KioskLayout title="Check your details" step={{ current: 8, total: 8, label: "Review" }}>
        <EmptyState
          tone="alert"
          icon={<TriangleAlert className="h-5 w-5" />}
          title="Could not load your summary"
          description={loadError}
          action={<Button size="lg" onClick={() => window.location.reload()}>Try again</Button>}
          secondaryAction={
            <Button size="lg" variant="secondary" onClick={() => navigate("/patient/history")}>
              Back to questions
            </Button>
          }
        />
      </KioskLayout>
);
  }

  if (loading || !summary || !token) {
    return (
      <KioskLayout title="Check your details" step={{ current: 8, total: 8, label: "Review" }}>
        <div className="space-y-3">
          <Skeleton className="h-[92px] w-full rounded-[14px]" />
          <Skeleton className="h-[168px] w-full rounded-[14px]" />
          <Skeleton className="h-[120px] w-full rounded-[14px]" />
        </div>
      </KioskLayout>
);
  }

  /** Real submission: recompiles the draft server-side and puts it on the board. */
  const submit = async () => {
    if (sending) return;
    setSending(true);
    try {
      await submitToDoctor();
      toast("Sent to the doctor for review.", {
        detail: `Your summary is now in ${token.doctorName}'s queue.`,
      });
      navigate(`/patient/queue/${token.id}`);
    } catch (err) {
      toast(errorMessage(err), {
        tone: "flag",
        detail: "Nothing was sent. Please check the connection and try again.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <KioskLayout
      title="Check your details"
      intro="Everything below goes to the doctor as it appears here. Open any part to change it before you send."
      step={{ current: 8, total: 8, label: "Review" }}
      aside={<Badge tone="solid" mark="dot">{token.number}</Badge>}
      stickyFooter={
        <div className="flex items-center gap-2.5">
          <Button size="kiosk" className="flex-1" loading={sending} onClick={() => void submit()} iconRight={<ArrowRight className="h-4 w-4" />}>
            {sending ? "Sending…" : "Send to doctor"}
          </Button>
          <Button variant="secondary" size="kiosk" onClick={() => navigate("/patient/documents")}>
            Add more
          </Button>
        </div>
      }
    >
      {/* What the doctor sees first */}
      <div className="glass-strong overflow-hidden rounded-[16px]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-ink">Visit card</h2>
          <SourceBadge source="patient-stated" />
        </div>
        <dl className="grid grid-cols-2 gap-px bg-line">
          {[
            { k: "Patient", v: token.patientName },
            { k: "Age / sex", v: `${token.age} / ${token.sex}` },
            { k: "Facility", v: token.hospitalName },
            { k: "Department", v: token.department },
            { k: "Doctor", v: token.doctorName },
            { k: "Token", v: token.number, mono: true },
          ].map(row => (
            <div key={row.k} className="bg-white/70 px-5 py-3">
              <dt className="text-sm uppercase tracking-[0.12em] text-ink/60">{row.k}</dt>
              <dd className={`mt-1 truncate text-base font-medium text-ink ${row.mono ? "tabular font-mono" : ""}`}>
                {row.v || "—"}
              </dd>
            </div>
))}
        </dl>
      </div>

      <section className="mt-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-ink">History you gave</h2>
          <Button size="sm" variant="tertiary" onClick={() => navigate("/patient/history")} icon={<PencilLine className="h-3.5 w-3.5" />}>
            Edit answers
          </Button>
        </div>
        <Card padding="none" className="divide-y divide-line border-line bg-white/50">
          {[
            { k: "Main problem", v: summary.chiefComplaint },
            { k: "History", v: summary.historyOfPresentIllness },
            { k: "Medicines now", v: summary.medications.join(" · ") },
            { k: "Allergies", v: summary.allergies.join(", ") },
            { k: "Long-term illness", v: summary.pastMedicalHistory },
          ].map(row => (
            <div key={row.k} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[170px_1fr] sm:gap-4">
              <dt className="text-sm sm:text-base text-ink/60">{row.k}</dt>
              <dd className="text-base leading-relaxed text-ink">{row.v}</dd>
            </div>
))}
        </Card>
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-ink">Records attached</h2>
          <span className="flex items-center gap-1.5 text-sm sm:text-base text-ink/60">
            <FileText className="h-3.5 w-3.5" />
            {docs.length} read
          </span>
        </div>
        {docs.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-line px-4 py-5 text-base text-ink/60">
            No documents scanned yet. You can go back and add one, or continue without.
          </p>
) : (
          <ul className="space-y-1.5">
            {docs.map(d => (
              <li key={d.id} className="glass flex items-center gap-3 rounded-[11px] px-4 py-2.5">
                <span className="truncate text-base text-ink">{d.name}</span>
                <span className="ml-auto shrink-0 text-sm text-ink/60">{d.date}</span>
                <Badge tone="solid" mark="dot">Read</Badge>
              </li>
))}
          </ul>
)}
      </section>

      {summary.redFlags.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 font-display text-lg font-semibold tracking-[-0.015em] text-ink">
            Flagged for the doctor
          </h2>
          {summary.redFlags.map(rf => (
            <div key={rf.id} className="glass flex items-start gap-3.5 rounded-[13px] border-ink/25 p-4">
              <TriangleAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink" />
              <div className="min-w-0">
                <p className="text-base font-medium leading-snug text-ink">{rf.finding}</p>
                <p className="mt-1.5 text-base leading-relaxed text-ink/60">{rf.reason}</p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink/60">
                  <SourceBadge source={rf.source} />
                  <span>·</span>
                  <span>From your report dated {rf.timestamp}</span>
                </p>
              </div>
            </div>
))}
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink/60">
            This is not a diagnosis. It marks something the doctor should look at before deciding.
          </p>
        </section>
)}

      <section className="glass mt-5 rounded-[14px] p-5">
        <div className="flex items-center gap-2.5">
          <Layers className="h-4 w-4 text-ink/55" />
          <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-ink">Draft clinical summary</h2>
          <Badge tone="outline" className="ml-auto">Unverified</Badge>
        </div>
        <p className="mt-2.5 text-base leading-relaxed text-ink/65">
          A written-up version of your answers and your reports, prepared so the doctor starts the conversation
          already informed. It is a draft, not a finding. The doctor edits or confirms it before it counts.
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-ink/60">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Compiled from 12 answers and {docs.length} documents · {summary.compiledAt}
        </div>
      </section>

      <p className="mt-5 text-sm sm:text-base leading-relaxed text-ink/60">
        You can also hand the papers to the desk. Sending now only moves your file to the front of the review list.
      </p>
    </KioskLayout>
);
}
