import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Lock, EyeOff, FileSignature, ArrowRight, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/utils/cn";

const POINTS = [
  {
    icon: EyeOff,
    title: "Only your token number goes on the board",
    body: "Your name, your answers and your reports stay inside the doctor's screen.",
  },
  {
    icon: FileSignature,
    title: "You are giving a history, not a diagnosis",
    body: "The kiosk writes down what you say. The doctor decides what it means.",
  },
  {
    icon: Lock,
    title: "Cleared when you walk away",
    body: "If the screen sits unused it resets itself and wipes what you typed.",
  },
];

export default function ConsentPage() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [agreed, setAgreed] = useState(true);

  return (
    <KioskLayout
      title={t("consent.title")}
      intro={t("consent.intro")}
      step={{ current: 4, total: 8, label: "Consent" }}
    >
      <div className="rounded-[16px] border border-emerald-500/40 bg-emerald-50/80 p-4.5 text-left shadow-xs dark:border-emerald-500/30 dark:bg-emerald-950/40">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-600 font-bold text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-extrabold tracking-[-0.01em] text-zinc-900 dark:text-zinc-50">
              {t("consent.privacyTitle")}
            </p>
            <p className="mt-1 text-base font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
              {t("consent.privacyBody")}
            </p>
          </div>
        </div>
      </div>

      <ol className="mt-3.5 space-y-2.5">
        {POINTS.map((p, i) => (
          <li
            key={p.title}
            className="flex items-start gap-3.5 rounded-[14px] border border-zinc-200 bg-white/90 p-4 text-left shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900/90"
            style={{ ["--i" ]: i + 2 }}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <p.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </span>
            <div className="min-w-0">
              <p className="text-base md:text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-100">
                {p.title}
              </p>
              <p className="mt-1 text-base font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                {p.body}
              </p>
            </div>
            <span className="tabular ml-auto shrink-0 self-start font-mono text-sm font-bold text-zinc-400 dark:text-zinc-500">
              0{i + 1}
            </span>
          </li>
))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="outline" mark="ring">No diagnosis is made here</Badge>
        <Badge tone="quiet">Data used for this visit only</Badge>
      </div>

      {/* Interactive Consent Checkbox with clear active highlight */}
      <label
        htmlFor="consent-agree"
        className={cn(
          "mt-4.5 flex cursor-pointer items-center gap-3.5 rounded-[14px] border-2 p-4 transition-all duration-200 shadow-xs",
          agreed
            ? "border-emerald-500 bg-emerald-50/70 dark:border-emerald-500/60 dark:bg-emerald-950/40"
            : "border-zinc-300 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/80 hover:border-zinc-400"
)}
      >
        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
          <input
            id="consent-agree"
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="peer h-6 w-6 cursor-pointer appearance-none rounded-[7px] border-2 border-emerald-600 bg-white checked:bg-emerald-600 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-400 dark:checked:bg-emerald-500"
          />
          <Check className="pointer-events-none absolute h-4 w-4 text-white peer-checked:opacity-100 opacity-0 transition-opacity dark:text-zinc-950" strokeWidth={3} />
        </span>
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t("consent.agree")}
        </span>
      </label>

      {/* Unmissable, High-Contrast Solid Continue Button */}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 sm:-mx-6 sm:px-6 z-20">
        <button
          type="button"
          disabled={!agreed}
          onClick={() => navigate("/patient/registration")}
          className={cn(
            "w-full inline-flex items-center justify-center gap-3 rounded-[14px] px-8 py-4 text-lg font-extrabold text-white shadow-xl transition-all duration-150 active:scale-95 cursor-pointer",
            agreed
              ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 active:bg-emerald-700 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
              : "bg-zinc-400 text-zinc-200 cursor-not-allowed opacity-60 dark:bg-zinc-700 dark:text-zinc-400"
)}
        >
          <span>{t("consent.continue")}</span>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </button>
      </div>
    </KioskLayout>
);
}
