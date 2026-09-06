import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/utils/cn";

export function LanguageSelector({ className, variant = "header" }) {
  const { language, setLanguage, languages } = useApp();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click or ESC
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (lang) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          "group flex h-10 items-center gap-2 rounded-[10px] border px-3 text-base font-medium transition-all duration-[300ms]",
          // Light Mode
          "border-zinc-300/80 bg-white/90 text-zinc-900 hover:border-zinc-500 hover:bg-white",
          // Dark Mode
          "dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white shadow-sm",
          open && "border-zinc-900 bg-white dark:border-white dark:bg-zinc-800"
)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select language. Current: ${language.label}`}
        title={`Change Language (${language.nativeLabel})`}
      >
        <Globe className="h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-300 group-hover:rotate-12 dark:text-zinc-300" />
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {language.nativeLabel}
        </span>
        {variant !== "compact" && (
          <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:inline">
            ({language.label})
          </span>
)}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-300 dark:text-zinc-400",
            open && "rotate-180"
)}
        />
      </button>

      {open && (
        <div
          className={cn(
            "animate-toast-in absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-[14px] border p-1.5 shadow-2xl backdrop-blur-2xl",
            "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
)}
          role="listbox"
          aria-label="Languages"
        >
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Select Language / भाषा चुनें
            </p>
          </div>
          <div className="py-1 space-y-0.5">
            {languages.map(lang => {
              const active = lang.code === language.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang)}
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-[9px] px-3 py-2.5 text-left text-base transition-all duration-200",
                    active
                      ? "bg-zinc-900 font-bold text-white shadow-sm dark:bg-white dark:text-zinc-950"
                      : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
)}
                >
                  <div className="flex flex-col">
                    <span className="text-base md:text-lg font-semibold leading-snug">
                      {lang.nativeLabel}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        active
                          ? "text-zinc-300 dark:text-zinc-600 font-medium"
                          : "text-zinc-500 dark:text-zinc-400"
)}
                    >
                      {lang.label}
                    </span>
                  </div>
                  {active && (
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-white dark:text-zinc-950" : "text-transparent"
)}
                      strokeWidth={2.5}
                    />
)}
                </button>
);
            })}
          </div>
        </div>
)}
    </div>
);
}
