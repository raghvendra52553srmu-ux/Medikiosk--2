import { Building2, ShieldCheck, Landmark, HeartHandshake, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";

export function HospitalTypeBadge({ type, className, size = "sm" }) {
  const normalized = type.toLowerCase();
  const isGov = normalized.includes("gov") || normalized.includes("state") || normalized.includes("district") || normalized.includes("zilla") || normalized.includes("municipal") || normalized.includes("aiims");
  const isPvt = normalized.includes("pvt") || normalized.includes("private") || normalized.includes("ltd");
  const isTrust = normalized.includes("trust") || normalized.includes("charit") || normalized.includes("society");

  if (isGov) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium tracking-[0.01em] transition-colors",
          size === "sm" ? "px-2.5 py-0.5 text-sm" : "px-3 py-1 text-sm",
          "border border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-300",
          className
)}
      >
        <Landmark className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>Government Hospital</span>
      </span>
);
  }

  if (isPvt) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium tracking-[0.01em] transition-colors",
          size === "sm" ? "px-2.5 py-0.5 text-sm" : "px-3 py-1 text-sm",
          "border border-blue-600/30 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-950/50 dark:text-blue-300",
          className
)}
      >
        <Building2 className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>Private Hospital</span>
      </span>
);
  }

  if (isTrust) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium tracking-[0.01em] transition-colors",
          size === "sm" ? "px-2.5 py-0.5 text-sm" : "px-3 py-1 text-sm",
          "border border-amber-600/30 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-300",
          className
)}
      >
        <HeartHandshake className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>Trust / Charitable</span>
      </span>
);
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium tracking-[0.01em] transition-colors",
        size === "sm" ? "px-2.5 py-0.5 text-sm" : "px-3 py-1 text-sm",
        "border border-line bg-white/60 text-ink/70 dark:border-white/15 dark:bg-white/10 dark:text-zinc-300",
        className
)}
    >
      <Building2 className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>{type || "General Facility"}</span>
    </span>
);
}

export function HospitalIllustration({ type, name, className, variant = "card" }) {
  const normalized = (type + " " + (name ?? "")).toLowerCase();
  const isGov = normalized.includes("gov") || normalized.includes("state") || normalized.includes("district") || normalized.includes("civil") || normalized.includes("zilla") || normalized.includes("municipal") || normalized.includes("aiims") || normalized.includes("esic");

  if (isGov) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[14px] border transition-all duration-300",
          "border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-zinc-900/10 to-emerald-900/10",
          "dark:border-emerald-500/30 dark:from-emerald-950/60 dark:via-zinc-900/70 dark:to-emerald-900/40",
          variant === "hero" ? "h-44 sm:h-52 w-full p-6" : variant === "compact" ? "h-24 w-full p-3" : "h-32 w-full p-4",
          className
)}
      >
        {/* Background architectural grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

        {/* SVG Government Medical Complex Graphics */}
        <svg
          className="absolute right-2 bottom-0 h-full w-48 sm:w-64 text-emerald-600/30 dark:text-emerald-400/25 pointer-events-none select-none"
          viewBox="0 0 240 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Government Facade with Columns */}
          <rect x="20" y="40" width="200" height="100" rx="3" fill="currentColor" fillOpacity="0.35" />
          <path d="M10 40 L120 10 L230 40 Z" fill="currentColor" fillOpacity="0.5" />
          {/* Ashoka / Health emblem crest */}
          <circle cx="120" cy="28" r="7" fill="currentColor" fillOpacity="0.8" />
          <circle cx="120" cy="28" r="4" fill="currentColor" fillOpacity="0.3" />

          {/* Pillars */}
          <rect x="35" y="45" width="12" height="90" fill="currentColor" fillOpacity="0.6" />
          <rect x="65" y="45" width="12" height="90" fill="currentColor" fillOpacity="0.6" />
          <rect x="95" y="45" width="12" height="90" fill="currentColor" fillOpacity="0.6" />
          <rect x="133" y="45" width="12" height="90" fill="currentColor" fillOpacity="0.6" />
          <rect x="163" y="45" width="12" height="90" fill="currentColor" fillOpacity="0.6" />
          <rect x="193" y="45" width="12" height="90" fill="currentColor" fillOpacity="0.6" />

          {/* Entrance Doorway & Red Cross */}
          <rect x="110" y="85" width="20" height="55" rx="10" fill="currentColor" fillOpacity="0.8" />
          <path d="M117 60 H123 M120 57 V63" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />

          {/* Windows row */}
          <rect x="40" y="55" width="6" height="10" rx="1" fill="#fff" fillOpacity="0.6" />
          <rect x="70" y="55" width="6" height="10" rx="1" fill="#fff" fillOpacity="0.6" />
          <rect x="168" y="55" width="6" height="10" rx="1" fill="#fff" fillOpacity="0.6" />
          <rect x="198" y="55" width="6" height="10" rx="1" fill="#fff" fillOpacity="0.6" />
        </svg>

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-sm font-semibold uppercase tracking-wider text-white shadow-sm">
              <Landmark className="h-3.5 w-3.5" />
              Government Facility
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/80 dark:bg-black/60 px-2 py-0.5 text-sm font-medium text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-3 w-3" />
              Public OPD · Free/Subsidized
            </span>
          </div>

          <div className="max-w-[70%]">
            <p className="text-sm font-medium text-emerald-900/80 dark:text-emerald-200">
              District Health Services &amp; Civil Hospital Network
            </p>
            {variant === "hero" && (
              <p className="mt-1 text-sm text-emerald-800/70 dark:text-emerald-300/70">
                Ayushman Bharat &amp; National Health Mission (NHM) integrated OPD services.
              </p>
)}
          </div>
        </div>
      </div>
);
  }

  // Private Hospital Visual
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[14px] border transition-all duration-300",
        "border-blue-500/20 bg-gradient-to-br from-blue-950/20 via-zinc-900/10 to-indigo-900/10",
        "dark:border-blue-500/30 dark:from-blue-950/60 dark:via-zinc-900/70 dark:to-indigo-900/40",
        variant === "hero" ? "h-44 sm:h-52 w-full p-6" : variant === "compact" ? "h-24 w-full p-3" : "h-32 w-full p-4",
        className
)}
    >
      {/* Modern Glass Grid Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

      {/* Modern High-Rise Private Hospital SVG */}
      <svg
        className="absolute right-2 bottom-0 h-full w-48 sm:w-64 text-blue-600/30 dark:text-blue-400/25 pointer-events-none select-none"
        viewBox="0 0 240 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main Glass Tower */}
        <rect x="70" y="15" width="110" height="125" rx="6" fill="currentColor" fillOpacity="0.4" />
        {/* Side Wing */}
        <rect x="160" y="45" width="65" height="95" rx="4" fill="currentColor" fillOpacity="0.3" />
        <rect x="25" y="65" width="55" height="75" rx="4" fill="currentColor" fillOpacity="0.25" />

        {/* Helipad / Top Roof Crown */}
        <line x1="85" y1="15" x2="165" y2="15" stroke="currentColor" strokeWidth="4" />
        <circle cx="125" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
        <text x="122" y="11" fill="currentColor" fontSize="8" fontWeight="bold">H</text>

        {/* Modern Medical Cross Emblem */}
        <rect x="110" y="32" width="30" height="30" rx="6" fill="currentColor" fillOpacity="0.7" />
        <path d="M120 47 H130 M125 42 V52" stroke="#fff" strokeWidth="3" strokeLinecap="round" />

        {/* Modern Window Grid Matrix */}
        {[0, 1, 2, 3].map(row => (
          <g key={row}>
            <rect x="80" y={70 + row * 15} width="18" height="9" rx="2" fill="#fff" fillOpacity="0.65" />
            <rect x="105" y={70 + row * 15} width="18" height="9" rx="2" fill="#fff" fillOpacity="0.65" />
            <rect x="130" y={70 + row * 15} width="18" height="9" rx="2" fill="#fff" fillOpacity="0.65" />
            <rect x="155" y={70 + row * 15} width="18" height="9" rx="2" fill="#fff" fillOpacity="0.65" />
          </g>
))}
      </svg>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1 text-sm font-semibold uppercase tracking-wider text-white shadow-sm">
            <Building2 className="h-3.5 w-3.5" />
            Private Hospital
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white/80 dark:bg-black/60 px-2 py-0.5 text-sm font-medium text-blue-800 dark:text-blue-300">
            <Sparkles className="h-3 w-3" />
            Multi-Specialty &amp; Advanced Care
          </span>
        </div>

        <div className="max-w-[70%]">
          <p className="text-sm font-medium text-blue-900/80 dark:text-blue-200">
            Private Multi-Specialty &amp; Tertiary Healthcare Center
          </p>
          {variant === "hero" && (
            <p className="mt-1 text-sm text-blue-800/70 dark:text-blue-300/70">
              NABH accredited private hospital OPD with specialist consultation and diagnostics.
            </p>
)}
        </div>
      </div>
    </div>
);
}
