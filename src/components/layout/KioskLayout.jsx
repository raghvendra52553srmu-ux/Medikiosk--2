import { useEffect, useState } from "react";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { HelpPanel, SessionWatch } from "@/components/kiosk/KioskSupport";
import { readFacilitySession } from "@/services/hospitalService";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/utils/cn";

export const KIOSK_STEPS = [
  "Consent", "Language", "Details", "Location", "Facility", "Doctor", "Token", "History", "Records", "Review",
];












export function KioskLayout({
  children, title, intro, showBack = true, step, aside, stickyFooter,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useApp();
  const [helpOpen, setHelpOpen] = useState(false);
  const [place, setPlace] = useState(null);

  const isEntry = location.pathname === "/patient";

  useEffect(() => {
    const session = readFacilitySession();
    setPlace(session?.place?.label ?? null);
  }, [location.pathname]);

  useEffect(() => {
    if (!helpOpen) return;
    const onKey = (e) => e.key === "Escape" && setHelpOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen]);

  return (
    <div className="app-ambient relative flex min-h-full flex-col">
      <SessionWatch onEnd={() => navigate("/patient")} />
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />

      <header className="sticky top-0 z-30 border-b border-line bg-white/65 dark:bg-zinc-950/80 backdrop-blur-2xl saturate-150">
        <div className="mx-auto flex h-[60px] max-w-[1400px] items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {showBack && !isEntry && (
              <button
                onClick={() => navigate(-1)}
                className={cn(
                  "group -ml-1 flex h-10 items-center gap-1.5 rounded-[10px] px-2.5 text-base text-ink/65",
                  "transition-all duration-[320ms] [transition-timing-function:var(--ease-glide)]",
                  "hover:bg-ink/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
)}
                aria-label={t("kiosk.back")}
              >
                <ArrowLeft className="h-[18px] w-[18px] transition-transform duration-[320ms] [transition-timing-function:var(--ease-glide)] group-hover:-translate-x-0.5" />
                <span className="hidden sm:inline">{t("kiosk.back")}</span>
              </button>
)}
            <button
              onClick={() => navigate("/patient")}
              className="flex min-w-0 items-center gap-2.5 rounded-lg pl-0.5 text-left"
              aria-label="MediKiosk home"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-emerald-600 font-display text-base font-bold text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950">
                M
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base md:text-lg font-semibold leading-none tracking-[-0.02em] text-ink">
                  MediKiosk
                </span>
                <span className="mt-1 block truncate text-sm leading-none text-ink/60">
                  {place ? `${place} · OPD` : "OPD registration"}
                </span>
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {aside}
            <LanguageSelector variant="compact" />
            <ThemeToggle />
            <button
              onClick={() => setHelpOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-[10px] border border-line bg-white/60 dark:bg-white/[0.06] px-3 text-base font-medium text-ink/75 dark:text-zinc-300 backdrop-blur transition-all duration-[320ms] [transition-timing-function:var(--ease-glide)] hover:border-white hover:bg-white hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
              aria-label={t("kiosk.help")}
            >
              <LifeBuoy className="h-4 w-4" />
              <span className="hidden sm:inline">{t("kiosk.help")}</span>
            </button>
          </div>
        </div>

        {step && (
          <div className="border-t border-line/70 bg-white/35">
            <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-2 sm:px-6">
              <span className="shrink-0 text-sm font-semibold uppercase tracking-[0.14em] text-ink/55">
                {step.label}
              </span>
              <div
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-ink/10"
                role="progressbar"
                aria-valuenow={step.current}
                aria-valuemin={1}
                aria-valuemax={step.total}
                aria-label={`${step.label} — step ${step.current} of ${step.total}`}
              >
                <div
                  className="h-full rounded-full bg-ink transition-[width] duration-[720ms] [transition-timing-function:var(--ease-glide)]"
                  style={{ width: `${(step.current / step.total) * 100}%` }}
                />
              </div>
              <span className="tabular shrink-0 text-sm font-medium text-ink/60">
                {t("kiosk.stepOf", { current: step.current, total: step.total })}
              </span>
            </div>
          </div>
)}
      </header>

      <main className={cn("flex-1 px-4 pb-10 pt-6 sm:px-6", stickyFooter && "pb-28")}>
        <div className="mx-auto max-w-[1400px]">
          {title && (
            <h1 className="reveal font-display text-3xl md:text-4xl font-semibold leading-[1.15] tracking-[-0.03em] text-ink sm:text-5xl">
              {title}
            </h1>
)}
          {intro && (
            <p
              className="reveal mt-2.5 max-w-xl text-lg leading-relaxed text-ink/60"
              style={{ ["--i" ]: 1 }}
            >
              {intro}
            </p>
)}
          <div className={cn(title || intro ? "mt-7" : "")} key={location.pathname}>
            {children}
          </div>
        </div>
      </main>

      {stickyFooter && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/60 backdrop-blur-2xl saturate-150">
          <div className="mx-auto max-w-[1400px] px-4 py-3.5 sm:px-6">{stickyFooter}</div>
        </div>
)}
    </div>
);
}
