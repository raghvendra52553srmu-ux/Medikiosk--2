import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { useApp } from "@/context/AppContext";
import { cn } from "@/utils/cn";
import { Check, Mic } from "lucide-react";

export default function LanguagePage() {
  const navigate = useNavigate();
  const { language, setLanguage, languages, t } = useApp();

  return (
    <KioskLayout
      title={t("language.title")}
      intro={t("language.helper")}
      step={{ current: 2, total: 10, label: "Language" }}
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        {languages.map((lang, i) => {
          const selected = language.code === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang); navigate("/patient/registration"); }}
              aria-pressed={selected}
              style={{ ["--i" ]: i }}
              className={cn(
                "reveal group relative flex min-h-[104px] items-center justify-between gap-3 rounded-[14px] border p-5 text-left",
                "transition-all duration-[420ms] [transition-timing-function:var(--ease-glide)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                selected
                  ? "border-ink bg-ink text-white shadow-[0_18px_40px_-22px_rgba(11,11,12,0.9)]"
                  : "glass glass-hover border-line hover:border-ink/30"
)}
            >
              <span className="min-w-0">
                <span className={cn("block font-display text-3xl font-semibold leading-tight tracking-[-0.02em]", selected ? "text-white" : "text-ink")}>
                  {lang.nativeLabel}
                </span>
                <span className={cn("mt-1 block text-sm sm:text-base", selected ? "text-white/60" : "text-ink/60")}>
                  {lang.label}
                </span>
              </span>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-[420ms] [transition-timing-function:var(--ease-spring)]",
                  selected ? "border-white/35 bg-white/15" : "border-ink/15 bg-white/60 opacity-0 group-hover:opacity-100"
)}
              >
                {selected ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : null}
              </span>
            </button>
);
        })}
      </div>

      <div className="glass mt-4 flex items-start gap-3 rounded-[13px] p-4">
        <Mic className="mt-0.5 h-4 w-4 shrink-0 text-ink/55" />
        <p className="text-base leading-relaxed text-ink/60">
          Questions can be read out to you and answered by voice, in the language you pick here.
        </p>
      </div>
    </KioskLayout>
);
}
