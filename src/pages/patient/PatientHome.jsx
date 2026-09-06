import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ClipboardPlus, Ticket } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { readClinic } from "@/services/patientService";

export default function PatientHome() {
  const navigate = useNavigate();
  const { t } = useApp();
  const clinic = readClinic();
  const hasVisit = Boolean(clinic.hospitalId);

  return (
    <KioskLayout showBack={false}>
      <div className="flex min-h-[58vh] flex-col justify-center">
        <h1 className="reveal font-display text-5xl font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-6xl">
          {t("home.title")}
        </h1>
        <p
          className="reveal mt-4 max-w-lg text-lg leading-relaxed text-ink/60"
          style={{ ["--i" ]: 1 }}
        >
          {t("home.subtitle")}
        </p>

        <div className="reveal mt-8 flex flex-col gap-3 sm:flex-row" style={{ ["--i" ]: 2 }}>
          <Button
            size="kiosk"
            icon={<ClipboardPlus className="h-[18px] w-[18px]" />}
            iconRight={<ArrowRight className="h-4 w-4" />}
            onClick={() => navigate("/patient/problem")}
          >
            {t("home.newRegistration")}
          </Button>
          <Button
            variant="secondary"
            size="kiosk"
            icon={<Ticket className="h-[18px] w-[18px]" />}
            onClick={() => navigate("/patient/queue/t1")}
          >
            {t("home.haveToken")}
          </Button>
        </div>

        {hasVisit && (
          <div className="glass reveal mt-8 inline-flex w-fit items-center gap-3 rounded-[12px] px-4 py-3" style={{ ["--i" ]: 3 }}>
            <span className="tabular font-mono text-xl font-semibold text-ink">{clinic.tokenNumber}</span>
            <span className="h-5 w-px bg-ink/15" />
            <span className="max-w-[16rem] truncate text-base text-ink/60">
              {clinic.hospitalName} · {clinic.department || "department pending"}
            </span>
            <button
              onClick={() => navigate("/patient/queue/t1")}
              className="ml-1 text-base font-medium text-ink underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-ink"
            >
              Open
            </button>
          </div>
)}

        <p className="reveal mt-10 max-w-md text-sm sm:text-base leading-relaxed text-ink/60" style={{ ["--i" ]: 4 }}>
          {t("home.privacyNote")}
        </p>
      </div>
    </KioskLayout>
);
}
