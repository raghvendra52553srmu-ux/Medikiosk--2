import { Mic, Ticket, Volume2, Globe2, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

export function VillageVisualGuide() {

  const steps = [
    {
      step: 1,
      icon: Globe2,
      badge: "Step 1 / चरण १",
      title: "Select Language / भाषा चुनें",
      desc: "अपनी मातृभाषा चुनें (हिन्दी, বাংলা, मराठी, தமிழ், తెలుగు, English)",
      color: "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
      accent: "bg-blue-600",
      svgGraphic: (
        <svg className="w-16 h-16 opacity-80" viewBox="0 0 64 64" fill="none" stroke="currentColor">
          <circle cx="32" cy="32" r="24" strokeWidth="2.5" />
          <ellipse cx="32" cy="32" rx="12" ry="24" strokeWidth="2.5" />
          <line x1="8" y1="32" x2="56" y2="32" strokeWidth="2.5" />
          <circle cx="46" cy="20" r="3" fill="currentColor" />
        </svg>
),
    },
    {
      step: 2,
      icon: Mic,
      badge: "Step 2 / चरण २",
      title: "Speak Problem / बोलकर बताएं",
      desc: "माइक बटन दबाएं और अपनी बीमारी बोलें — लिखना-पढ़ना ज़रूरी नहीं",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      accent: "bg-emerald-600",
      svgGraphic: (
        <svg className="w-16 h-16 opacity-80" viewBox="0 0 64 64" fill="none" stroke="currentColor">
          <rect x="24" y="12" width="16" height="26" rx="8" strokeWidth="2.5" />
          <path d="M16 28 C16 40 48 40 48 28" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="32" y1="42" x2="32" y2="52" strokeWidth="3" strokeLinecap="round" />
          <line x1="22" y1="52" x2="42" y2="52" strokeWidth="3" strokeLinecap="round" />
          {/* Soundwaves */}
          <path d="M52 20 C56 24 56 32 52 36" strokeWidth="2" strokeLinecap="round" />
          <path d="M57 16 C63 22 63 38 57 44" strokeWidth="2" strokeLinecap="round" />
        </svg>
),
    },
    {
      step: 3,
      icon: Ticket,
      badge: "Step 3 / चरण ३",
      title: "Get OPD Slip / पर्ची प्राप्त करें",
      desc: "कियोस्क से टोकन पर्ची लें और सीधे डॉक्टर के कमरे में जाएं",
      color: "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
      accent: "bg-amber-600",
      svgGraphic: (
        <svg className="w-16 h-16 opacity-80" viewBox="0 0 64 64" fill="none" stroke="currentColor">
          <rect x="18" y="10" width="28" height="44" rx="4" strokeWidth="2.5" />
          <line x1="24" y1="20" x2="40" y2="20" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="28" x2="34" y2="28" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="24" y="36" width="16" height="10" rx="2" fill="currentColor" fillOpacity="0.3" strokeWidth="1.5" />
          <circle cx="32" cy="41" r="2" fill="currentColor" />
        </svg>
),
    },
  ];

  return (
    <div className="w-full rounded-[18px] border border-emerald-500/30 bg-gradient-to-br from-emerald-950/10 via-zinc-900/5 to-teal-950/10 p-5 dark:border-emerald-500/30 dark:from-emerald-950/40 dark:via-zinc-900/60 dark:to-teal-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3.5 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Volume2 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">
              आसान ३ चरण निर्देश · Easy 3-Step Visual Guide
            </h3>
            <p className="text-sm text-ink/60">
              लिखने या पढ़ने की ज़रूरत नहीं — सिर्फ बोलकर टोकन पर्ची पाएं
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          ग्रामीण और अनपढ़ मरीज़ों के लिए सुगम (Voice-First)
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map(s => (
          <div
            key={s.step}
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-[14px] border p-4 transition-all duration-300",
              "bg-white/75 dark:bg-zinc-900/75 hover:shadow-md",
              s.color
)}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={cn("rounded-md px-2 py-0.5 text-sm font-bold text-white", s.accent)}>
                  {s.badge}
                </span>
                <div className="text-ink/60 group-hover:scale-110 transition-transform duration-300">
                  {s.svgGraphic}
                </div>
              </div>

              <h4 className="mt-3 font-display text-lg font-bold text-ink leading-tight">
                {s.title}
              </h4>
              <p className="mt-1.5 text-sm sm:text-base leading-snug text-ink/70">
                {s.desc}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-1 text-sm font-semibold uppercase tracking-wider text-ink/60 pt-2 border-t border-line/40">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>आसान और स्वचालित</span>
            </div>
          </div>
))}
      </div>
    </div>
);
}
