import { Stethoscope, Building2, Ticket } from "lucide-react";
import { cn } from "@/utils/cn";

export function RoleIllustration({ role, className, variant = "card" }) {
  if (role === "patient") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[13px] border transition-all duration-300",
          "border-emerald-500/20 bg-gradient-to-br from-emerald-950/15 via-zinc-900/5 to-teal-900/10",
          "dark:border-emerald-500/30 dark:from-emerald-950/50 dark:via-zinc-900/60 dark:to-teal-900/30",
          variant === "banner" ? "h-36 w-full p-4" : "h-28 w-full p-3",
          className
)}
      >
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:14px_14px] opacity-15" />

        {/* Patient Kiosk Vector SVG Graphics */}
        <svg
          className="absolute right-2 bottom-0 h-full w-48 sm:w-56 text-emerald-600/35 dark:text-emerald-400/25 pointer-events-none select-none"
          viewBox="0 0 220 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Smart Kiosk Stand */}
          <rect x="130" y="20" width="60" height="90" rx="8" fill="currentColor" fillOpacity="0.4" />
          <rect x="136" y="26" width="48" height="60" rx="4" fill="#fff" fillOpacity="0.8" />
          {/* Screen UI Elements */}
          <rect x="142" y="32" width="24" height="6" rx="2" fill="#059669" />
          <rect x="142" y="42" width="36" height="4" rx="1.5" fill="#9ca3af" />
          <rect x="142" y="49" width="30" height="4" rx="1.5" fill="#9ca3af" />
          <rect x="142" y="58" width="36" height="12" rx="3" fill="#10b981" fillOpacity="0.9" />
          <circle cx="160" cy="64" r="3" fill="#fff" />

          {/* Token Dispenser Output */}
          <rect x="145" y="90" width="30" height="16" rx="2" fill="currentColor" fillOpacity="0.7" />
          <path d="M150 90 V102 H170 V90" stroke="#fff" strokeWidth="2" strokeDasharray="2 2" />

          {/* Patient Character Silhouette at Kiosk */}
          <circle cx="95" cy="40" r="12" fill="currentColor" fillOpacity="0.6" />
          <path d="M75 95 C75 68 82 60 95 60 C108 60 115 68 115 95 Z" fill="currentColor" fillOpacity="0.5" />
          {/* Reaching Hand to Kiosk */}
          <path d="M108 72 Q125 65 140 60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" />
        </svg>

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-sm font-semibold uppercase tracking-wider text-white shadow-sm">
              <Ticket className="h-3 w-3" />
              Open Patient Kiosk
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:text-emerald-300">
              No login required
            </span>
          </div>
          <p className="text-sm font-medium text-emerald-900/80 dark:text-emerald-200">
            Instant Token · Voice Intake · 6 Languages
          </p>
        </div>
      </div>
);
  }

  if (role === "doctor") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[13px] border transition-all duration-300",
          "border-indigo-500/20 bg-gradient-to-br from-indigo-950/15 via-zinc-900/5 to-blue-900/10",
          "dark:border-indigo-500/30 dark:from-indigo-950/50 dark:via-zinc-900/60 dark:to-blue-900/30",
          variant === "banner" ? "h-36 w-full p-4" : "h-28 w-full p-3",
          className
)}
      >
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:14px_14px] opacity-15" />

        {/* Doctor Workstation Vector SVG Graphics */}
        <svg
          className="absolute right-2 bottom-0 h-full w-48 sm:w-56 text-indigo-600/35 dark:text-indigo-400/25 pointer-events-none select-none"
          viewBox="0 0 220 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Workstation Desktop Screen */}
          <rect x="100" y="15" width="105" height="70" rx="6" fill="currentColor" fillOpacity="0.4" />
          <rect x="106" y="21" width="93" height="58" rx="4" fill="#fff" fillOpacity="0.85" />
          <rect x="145" y="85" width="15" height="15" fill="currentColor" fillOpacity="0.5" />
          <rect x="135" y="100" width="35" height="5" rx="2" fill="currentColor" fillOpacity="0.6" />

          {/* Clinical UI Lines & Stethoscope */}
          <rect x="112" y="28" width="40" height="6" rx="2" fill="#4f46e5" />
          <rect x="112" y="38" width="30" height="4" rx="1.5" fill="#9ca3af" />
          <rect x="112" y="45" width="35" height="4" rx="1.5" fill="#9ca3af" />
          {/* ECG Pulse graph */}
          <path d="M155 45 L162 45 L166 32 L172 58 L177 40 L181 45 L190 45" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Stethoscope Silhouette */}
          <path d="M35 50 C35 75 55 85 75 85 C95 85 105 75 105 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" fill="none" />
          <circle cx="75" cy="98" r="10" fill="currentColor" fillOpacity="0.7" />
          <circle cx="75" cy="98" r="5" fill="#fff" fillOpacity="0.9" />
          <line x1="75" y1="85" x2="75" y2="88" stroke="currentColor" strokeWidth="4" strokeOpacity="0.7" />
        </svg>

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-sm font-semibold uppercase tracking-wider text-white shadow-sm">
              <Stethoscope className="h-3 w-3" />
              Doctor Station
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-indigo-800 dark:text-indigo-300">
              PIN: 2468
            </span>
          </div>
          <p className="text-sm font-medium text-indigo-900/80 dark:text-indigo-200">
            Queue · Patient File · AI Summary &amp; Rx
          </p>
        </div>
      </div>
);
  }

  // Admin Role Illustration
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[13px] border transition-all duration-300",
        "border-sky-500/20 bg-gradient-to-br from-sky-950/15 via-zinc-900/5 to-cyan-900/10",
        "dark:border-sky-500/30 dark:from-sky-950/50 dark:via-zinc-900/60 dark:to-cyan-900/30",
        variant === "banner" ? "h-36 w-full p-4" : "h-28 w-full p-3",
        className
)}
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:14px_14px] opacity-15" />

      {/* Hospital Admin Vector SVG Graphics */}
      <svg
        className="absolute right-2 bottom-0 h-full w-48 sm:w-56 text-sky-600/35 dark:text-sky-400/25 pointer-events-none select-none"
        viewBox="0 0 220 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Multi-Monitor Command Operations */}
        <rect x="40" y="25" width="70" height="50" rx="4" fill="currentColor" fillOpacity="0.3" />
        <rect x="45" y="30" width="60" height="40" rx="3" fill="#fff" fillOpacity="0.8" />
        {/* Throughput Bar Charts */}
        <rect x="52" y="55" width="7" height="10" rx="1" fill="#0284c7" />
        <rect x="62" y="45" width="7" height="20" rx="1" fill="#0284c7" />
        <rect x="72" y="38" width="7" height="27" rx="1" fill="#0284c7" />
        <rect x="82" y="48" width="7" height="17" rx="1" fill="#0284c7" />
        <rect x="92" y="42" width="7" height="23" rx="1" fill="#0284c7" />

        {/* Main Central Operations Console */}
        <rect x="120" y="15" width="90" height="60" rx="5" fill="currentColor" fillOpacity="0.45" />
        <rect x="126" y="21" width="78" height="48" rx="3" fill="#fff" fillOpacity="0.85" />
        <rect x="157" y="75" width="16" height="20" fill="currentColor" fillOpacity="0.5" />
        <rect x="145" y="95" width="40" height="5" rx="2" fill="currentColor" fillOpacity="0.6" />

        {/* Gauge / Radar status circles on Main Console */}
        <circle cx="145" cy="45" r="14" stroke="#0284c7" strokeWidth="3" fill="none" />
        <path d="M145 45 L153 37" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="178" cy="38" r="6" fill="#10b981" />
        <rect x="170" y="50" width="22" height="4" rx="1.5" fill="#94a3b8" />
        <rect x="170" y="56" width="16" height="4" rx="1.5" fill="#94a3b8" />
      </svg>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-0.5 text-sm font-semibold uppercase tracking-wider text-white shadow-sm">
            <Building2 className="h-3 w-3" />
            Hospital Operations
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white/70 dark:bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:text-sky-300">
            PIN: 1357
          </span>
        </div>
        <p className="text-sm font-medium text-sky-900/80 dark:text-sky-200">
          OPD Throughput · Floor Load · Kiosk Health
        </p>
      </div>
    </div>
);
}
