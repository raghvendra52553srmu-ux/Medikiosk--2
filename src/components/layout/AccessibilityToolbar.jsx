import { useEffect, useRef, useState } from "react";
import { EyeOff, Volume2, Sun, Moon, ChevronDown, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/utils/cn";

export function AccessibilityToolbar({ className, variant = "strip" }) {
  const { language, setLanguage, languages, theme, toggleTheme, fontScale, setFontScale, t } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const langRef = useRef(null);
  const isDark = theme === "dark";

  // Handle outside click & escape for language menu
  useEffect(() => {
    if (!langOpen) return;
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [langOpen]);

  // Screen Reader: reads out page title and instructions
  const toggleScreenReader = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    const titleText = document.querySelector("h1")?.innerText || document.title || "MediKiosk";
    const subText = document.querySelector("main p")?.innerText || "";
    const fullText = `${titleText}. ${subText}`;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = language.code === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    setIsReading(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm",
        variant === "strip"
          ? "text-zinc-600 dark:text-zinc-300"
          : "rounded-[10px] border px-2 py-0.5 sm:px-2.5 sm:py-1 border-zinc-200/90 bg-white/90 text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200",
        className
      )}
      role="region"
      aria-label="Accessibility options"
    >
      {/* 1. SCREEN READER */}
      <button
        type="button"
        onClick={toggleScreenReader}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[7px] px-1.5 py-1 font-medium transition-all duration-200 active:scale-95",
          isReading
            ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-semibold"
            : "hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-white"
        )}
        title={isReading ? "Stop screen reader" : "Read page aloud (Screen Reader)"}
        aria-label="Screen Reader speech assistant"
      >
        {isReading ? (
          <Volume2 className="h-4 w-4 shrink-0 text-white dark:text-zinc-950 animate-pulse" />
        ) : (
          <EyeOff className="h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-300" />
        )}
        <span className="hidden sm:inline font-semibold">Screen Reader</span>
      </button>

      {/* Divider */}
      <span className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />

      {/* 2. TEXT SIZE CONTROLS: - A | A | A+ */}
      <div className="inline-flex items-center gap-0.5 sm:gap-1" role="group" aria-label="Text Size Controls">
        {/* Decrease (- A) */}
        <button
          type="button"
          onClick={() => setFontScale("sm")}
          className={cn(
            "rounded-[6px] px-1.5 py-0.5 font-bold transition-all duration-150 active:scale-95",
            fontScale === "sm"
              ? "bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-950"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          )}
          title="Decrease text size (- A)"
          aria-label="Decrease text size"
          aria-pressed={fontScale === "sm"}
        >
          <span className="text-xs sm:text-sm font-semibold tracking-tight">- A</span>
        </button>

        {/* Normal (A) */}
        <button
          type="button"
          onClick={() => setFontScale("normal")}
          className={cn(
            "rounded-[6px] px-1.5 py-0.5 font-bold transition-all duration-150 active:scale-95",
            fontScale === "normal"
              ? "bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-950"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          )}
          title="Normal text size (A)"
          aria-label="Default normal text size"
          aria-pressed={fontScale === "normal"}
        >
          <span className="text-sm sm:text-base font-bold">A</span>
        </button>

        {/* Increase (A+) */}
        <button
          type="button"
          onClick={() => setFontScale("lg")}
          className={cn(
            "rounded-[6px] px-1.5 py-0.5 font-bold transition-all duration-150 active:scale-95",
            fontScale === "lg"
              ? "bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-950"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          )}
          title="Increase text size (A+)"
          aria-label="Increase text size"
          aria-pressed={fontScale === "lg"}
        >
          <span className="text-sm sm:text-base font-extrabold tracking-tight">A+</span>
        </button>
      </div>

      {/* Divider */}
      <span className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />

      {/* 3. THEME TOGGLE (Sun/Moon icon) */}
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-[8px] transition-all duration-200 active:scale-90",
          "hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-white text-zinc-700 dark:text-zinc-200"
        )}
        title={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
        aria-label={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-indigo-400" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </button>

      {/* Divider */}
      <span className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />

      {/* 4. LANGUAGE SELECTOR DROPDOWN (English ⌵) */}
      <div className="relative inline-block text-left" ref={langRef}>
        <button
          type="button"
          onClick={() => setLangOpen(prev => !prev)}
          className={cn(
            "group inline-flex items-center gap-1 sm:gap-1.5 rounded-[8px] px-1.5 py-1 text-sm font-semibold transition-all duration-200 active:scale-95",
            "hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-white",
            langOpen && "bg-zinc-100 dark:bg-zinc-800"
          )}
          aria-haspopup="listbox"
          aria-expanded={langOpen}
          aria-label={`Selected language: ${language.label}. Click to change language`}
        >
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {language.label}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 dark:text-zinc-400",
              langOpen && "rotate-180"
            )}
          />
        </button>

        {langOpen && (
          <div
            className={cn(
              "animate-toast-in absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-[14px] border p-1.5 shadow-2xl backdrop-blur-2xl",
              "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            )}
            role="listbox"
            aria-label="Select Language"
          >
            <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Language / भाषा चुनें
              </p>
            </div>
            <div className="py-1 space-y-0.5 max-h-64 overflow-y-auto">
              {languages.map((lang) => {
                const active = lang.code === language.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setLangOpen(false);
                    }}
                    role="option"
                    aria-selected={active}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-sm transition-all duration-150",
                      active
                        ? "bg-zinc-900 font-bold text-white shadow-xs dark:bg-white dark:text-zinc-950"
                        : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold leading-tight">{lang.nativeLabel}</span>
                      <span
                        className={cn(
                          "text-xs",
                          active ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400 dark:text-zinc-500"
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
    </div>
  );
}
