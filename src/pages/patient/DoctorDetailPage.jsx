import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { getFacility } from "@/services/hospitalService";
import { getDoctorById } from "@/services/doctorService";
import { hasActiveSession, issueToken } from "@/services/patientService";
import { errorMessage } from "@/services/apiClient";
import { qk } from "@/lib/queryClient";
import { ArrowRight, Check, Clock, MapPin, Users } from "lucide-react";

export default function DoctorDetailPage() {
  const { doctorId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const hospital = useMemo(() => getFacility(params.get("h") ?? undefined), [params]);
  const [issuing, setIssuing] = useState(false);
  const [done, setDone] = useState(false);

  const { data: doctor, isLoading, isError } = useQuery({
    queryKey: qk.doctor(doctorId ?? "none"),
    queryFn: () => getDoctorById(doctorId),
    enabled: Boolean(doctorId),
  });

  if (isLoading) {
    return (
      <KioskLayout title="Confirm your OPD" step={{ current: 6, total: 10, label: "Doctor" }}>
        <div aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading doctor details…</span>
          <Skeleton className="h-[260px] w-full rounded-[16px]" />
        </div>
      </KioskLayout>
);
  }

  if (!hospital || !doctor || isError) {
    return (
      <KioskLayout title="Doctor unavailable" step={{ current: 6, total: 10, label: "Doctor" }}>
        <EmptyState
          tone="alert"
          icon={<Users className="h-5 w-5" />}
          title="This doctor could not be found"
          description="The department list may have refreshed. Choose a doctor again from the list."
          action={<Button size="lg" onClick={() => navigate(-1)}>Back to doctors</Button>}
        />
      </KioskLayout>
);
  }

  /**
   * Registration must already exist — the token is attached to a real patient
   * session, not to whoever happens to be standing at the kiosk.
   */
  const handleIssue = async () => {
    if (!hasActiveSession()) {
      toast("Please complete registration first.", {
        tone: "flag",
        detail: "We need your name and age before a token can be issued.",
      });
      navigate("/patient/registration");
      return;
    }

    setIssuing(true);
    try {
      const token = await issueToken(hospital, doctor);
      setDone(true);
      toast(`Token ${token.number} issued.`, { detail: `${token.doctorName} · ${token.department}` });
      window.setTimeout(() => navigate(`/patient/token/${token.id}`), 700);
    } catch (err) {
      toast(errorMessage(err), { tone: "flag" });
    } finally {
      setIssuing(false);
    }
  };

  return (
    <KioskLayout
      title="Confirm your OPD"
      intro="Check the room and the timing before you take a token. Tokens are free."
      step={{ current: 6, total: 10, label: "Doctor" }}
      stickyFooter={
        <div className="flex items-center gap-2.5">
          <Button
            size="kiosk"
            className="flex-1"
            loading={issuing}
            onClick={() => void handleIssue()}
            iconRight={done ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          >
            {issuing ? "Reserving your place…" : done ? "Token reserved" : "Take OPD token"}
          </Button>
          <Button variant="secondary" size="kiosk" onClick={() => navigate(-1)}>
            Change
          </Button>
        </div>
      }
    >
      <div className="glass-strong rounded-[16px] p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white/70 font-display text-xl font-semibold tracking-[-0.02em] text-ink">
            {doctor.initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-semibold leading-tight tracking-[-0.025em] text-ink">
              {doctor.name}
            </h2>
            <p className="mt-1 text-base text-ink/60">{doctor.qualification}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{doctor.department}</Badge>
              <Badge tone={doctor.available ? "solid" : "quiet"} mark={doctor.available ? "dot" : "ring"}>
                {doctor.available ? "Taking tokens" : "OPD closed"}
              </Badge>
            </div>
          </div>
        </div>

        <dl className="mt-5 grid gap-px overflow-hidden rounded-[12px] border border-line bg-line">
          {[
            { icon: Clock, k: "OPD timing", v: doctor.opdTiming },
            { icon: Users, k: "People waiting", v: `${doctor.queueSize} in this queue` },
            { icon: MapPin, k: "Room", v: doctor.room ? `Room ${doctor.room} · ${doctor.department} OPD` : `${doctor.department} OPD` },
          ].map(row => (
            <div key={row.k} className="flex items-center gap-3 bg-white/70 px-4 py-3">
              <row.icon className="h-4 w-4 shrink-0 text-ink/60" />
              <dt className="text-sm sm:text-base text-ink/55">{row.k}</dt>
              <dd className="ml-auto max-w-[60%] truncate text-right text-base font-medium text-ink">{row.v}</dd>
            </div>
))}
        </dl>
      </div>

      <div className="glass mt-3 flex items-start gap-3 rounded-[13px] p-4">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink/25 text-[10px] font-semibold text-ink/70">
          i
        </span>
        <p className="text-base leading-relaxed text-ink/60">
          After the token you will answer a few questions about your problem. That write-up reaches the doctor
          before your number is called, which is what shortens the visit.
        </p>
      </div>
    </KioskLayout>
);
}
