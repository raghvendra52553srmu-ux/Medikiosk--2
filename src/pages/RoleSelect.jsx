import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { ArrowUpRight, Stethoscope, User, Building2, Lock, Landmark, HeartHandshake, Mic, Ticket, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/layout/LanguageSelector";

const NAV_ROLES = [
  {
    role: "patient",
    titleKey: "role.patient.title",
    icon: User,
    path: "/patient/problem",
    locked: false,
  },
  {
    role: "doctor",
    titleKey: "role.doctor.title",
    icon: Stethoscope,
    path: "/doctor/dashboard",
    locked: true,
  },
  {
    role: "admin",
    titleKey: "role.admin.title",
    icon: Building2,
    path: "/admin/dashboard",
    locked: true,
  },
];

export default function RoleSelect() {
  const navigate = useNavigate();
  const { setRole, t } = useApp();

  const guideSteps

 = [
    {
      step: 1,
      icon: Mic,
      badgeKey: "guide.step2.badge",
      titleKey: "guide.step2.title",
      descKey: "guide.step2.desc",
      badgeColor: "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-zinc-950",
      borderColor: "border-emerald-500/50 dark:border-emerald-400/40",
      accentBg: "bg-emerald-50/80 dark:bg-emerald-950/50",
      highlight: true,
    },
    {
      step: 2,
      icon: Ticket,
      badgeKey: "guide.step3.badge",
      titleKey: "guide.step3.title",
      descKey: "guide.step3.desc",
      badgeColor: "bg-amber-600 text-white dark:bg-amber-400 dark:text-zinc-950",
      borderColor: "border-amber-500/40 dark:border-amber-400/30",
      accentBg: "bg-amber-50/70 dark:bg-amber-950/40",
    },
    {
      step: 3,
      icon: Stethoscope,
      badgeKey: "guide.step4.badge",
      titleKey: "guide.step4.title",
      descKey: "guide.step4.desc",
      badgeColor: "bg-indigo-600 text-white dark:bg-indigo-400 dark:text-zinc-950",
      borderColor: "border-indigo-500/40 dark:border-indigo-400/30",
      accentBg: "bg-indigo-50/70 dark:bg-indigo-950/40",
    },
  ];

  const handleStartPatientFlow = () => {
    setRole("patient");
    navigate("/patient/problem");
  };

  return (
    <div className="app-ambient min-h-full flex flex-col">
      {/* 1. FIXED TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-2xl saturate-150 dark:border-zinc-800 dark:bg-zinc-950/90 shadow-xs">
        <div className="mx-auto flex h-[64px] max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
          {/* Logo / Brand Name */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-600 font-display text-base font-bold text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950">
              M
            </span>
            <div className="flex flex-col text-left">
              <span className="font-display text-lg font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                MediKiosk
              </span>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hidden lg:block">
                {t("role.headerSubtitle")}
              </span>
            </div>
          </div>

          {/* Role Navigation Links in Top Navbar (High Contrast Selected State) */}
          <nav className="flex items-center gap-1 sm:gap-1.5 rounded-[12px] border border-zinc-300/80 bg-zinc-100/90 p-1 dark:border-zinc-700 dark:bg-zinc-900/90">
            {NAV_ROLES.map(r => (
              <button
                key={r.role}
                onClick={() => {
                  if (r.role === "patient") setRole("patient");
                  navigate(r.path);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-sm sm:text-base font-bold transition-all duration-150 active:scale-95 shadow-xs cursor-pointer whitespace-nowrap",
                  r.role === "patient"
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 ring-2 ring-emerald-500/40"
                    : "text-zinc-800 hover:bg-zinc-200/80 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white"
)}
              >
                <r.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="capitalize">{t(r.titleKey)}</span>
                {r.locked && <Lock className="h-3 w-3 opacity-70" />}
              </button>
))}
          </nav>

          {/* Right Controls: Manual Language Selector & Day/Night Mode */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 sm:px-6">
        {/* Prominent Eye-Catching Greeting Banner Right Below Navbar */}
        <div className="mt-5 w-full rounded-[18px] border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 p-4 sm:p-5 shadow-sm text-left dark:border-emerald-500/40 dark:from-emerald-950/60 dark:via-zinc-900/80 dark:to-teal-950/60">
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md dark:bg-emerald-500 dark:text-zinc-950">
              <HeartHandshake className="h-6 w-6" />
            </span>
            <div className="flex-1 text-left">
              <p className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold leading-snug tracking-[-0.01em] text-zinc-900 dark:text-zinc-50">
                {t("guide.welcome")}
              </p>
              <p className="mt-1 text-base sm:text-base font-semibold text-emerald-900 dark:text-emerald-300">
                {t("guide.welcomeSub")}
              </p>
            </div>
          </div>
        </div>

        <main className="flex flex-1 flex-col justify-center py-6 space-y-6 text-left">
          {/* HERO HEADER */}
          <div className="max-w-3xl text-left">
            <div className="reveal flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300">
                {t("role.tagline")}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-100/80 px-2.5 py-0.5 text-sm font-bold text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/70 dark:text-emerald-300">
                <Landmark className="h-3.5 w-3.5" />
                {t("role.badge.gov")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-100/80 px-2.5 py-0.5 text-sm font-bold text-blue-900 dark:border-blue-500/40 dark:bg-blue-950/70 dark:text-blue-300">
                <Building2 className="h-3.5 w-3.5" />
                {t("role.badge.pvt")}
              </span>
            </div>

            <h1
              className="reveal mt-3 font-display text-5xl font-bold leading-[1.1] tracking-[-0.03em] text-zinc-900 sm:text-6xl dark:text-zinc-50 text-left"
              style={{ ["--i" ]: 1 }}
            >
              {t("role.heroTitle")}{" "}
              <span className="block text-zinc-500 dark:text-zinc-400">{t("role.heroSubtitle")}</span>
            </h1>
          </div>

          {/* INSTRUCTIONS FOR ILLITERATE & VILLAGE PATIENTS (3 Clean Steps without select language) */}
          <div className="reveal space-y-5 rounded-[22px] border border-zinc-300/80 bg-white/90 p-5 sm:p-7 shadow-sm text-left dark:border-zinc-700/80 dark:bg-zinc-900/90" style={{ ["--i" ]: 2 }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
              <div className="text-left">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {t("guide.heading")}
                </h2>
                <p className="mt-1 text-base font-medium text-zinc-700 dark:text-zinc-300">
                  {t("guide.subheading")}
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-100 px-3.5 py-1 text-sm font-bold text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
                {t("guide.voiceBadge")}
              </span>
            </div>

            {/* 3 Step Visual Interactive Cards */}
            <div className="grid gap-4 sm:grid-cols-3 pt-1">
              {guideSteps.map(s => (
                <button
                  key={s.step}
                  type="button"
                  onClick={handleStartPatientFlow}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-[16px] border p-5 text-left transition-all duration-200 shadow-xs cursor-pointer",
                    "hover:shadow-md hover:border-emerald-500/60 hover:-translate-y-0.5 active:scale-95 active:ring-2 active:ring-emerald-500",
                    s.borderColor,
                    s.accentBg,
                    s.highlight && "ring-2 ring-emerald-500/40"
)}
                >
                  <div className="text-left">
                    <div className="flex items-center justify-between">
                      <span className={cn("rounded-md px-2.5 py-0.5 text-sm font-extrabold", s.badgeColor)}>
                        {t(s.badgeKey)}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs group-hover:scale-110 transition-transform">
                        <s.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </span>
                    </div>

                    <h3 className="mt-3.5 font-display text-xl font-bold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                      {t(s.titleKey)}
                    </h3>
                    <p className="mt-2 text-base font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {t(s.descKey)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-sm font-bold text-emerald-800 dark:text-emerald-300 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t("guide.easyTag")}</span>
                  </div>
                </button>
))}
            </div>

            {/* Main Action Button for Patient to Start Kiosk */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-base font-semibold text-zinc-800 dark:text-zinc-200">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t("guide.kioskOpen")}</span>
              </div>

              <button
                type="button"
                onClick={handleStartPatientFlow}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-[14px] bg-emerald-600 px-8 py-4 text-lg font-extrabold text-white shadow-xl shadow-emerald-600/30 transition-all duration-150 hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 active:bg-emerald-700 active:ring-4 active:ring-emerald-500/50 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 dark:active:bg-emerald-600 cursor-pointer"
              >
                <Mic className="h-5 w-5 shrink-0 animate-bounce" />
                <span>{t("guide.startBtn")}</span>
                <ArrowUpRight className="h-5 w-5 shrink-0" />
              </button>
            </div>
          </div>

          {/* SYSTEM STATUS LINE AT BOTTOM (PINs are Private) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm sm:text-base font-semibold text-zinc-600 dark:text-zinc-400 pt-1 text-left">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              {t("role.pin.patient")}
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-zinc-500" />
              {t("role.pin.doctor")}
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-zinc-500" />
              {t("role.pin.admin")}
            </span>
          </div>
        </main>
      </div>
    </div>
);
}
