import { Moon, Sun } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/utils/cn";

export function ThemeToggle({ className, showLabel = false }) {
  const { theme, toggleTheme } = useApp();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "group relative flex h-10 items-center justify-center gap-2 rounded-[10px] border px-3 text-base font-medium transition-all duration-[300ms]",
        // Light Mode
        "border-zinc-300/80 bg-white/90 text-zinc-900 hover:border-zinc-500 hover:bg-white",
        // Dark Mode
        "dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white shadow-sm",
        className
)}
      aria-label={isDark ? "Switch to Day mode" : "Switch to Night mode"}
      title={isDark ? "Day Mode (Light)" : "Night Mode (Dark)"}
    >
      <div className="relative flex h-4 w-4 items-center justify-center">
        <Sun
          className={cn(
            "h-4 w-4 transition-all duration-[420ms] [transition-timing-function:var(--ease-spring)]",
            isDark
              ? "rotate-90 scale-0 opacity-0 absolute"
              : "rotate-0 scale-100 opacity-100 text-amber-500"
)}
        />
        <Moon
          className={cn(
            "h-4 w-4 transition-all duration-[420ms] [transition-timing-function:var(--ease-spring)]",
            isDark
              ? "rotate-0 scale-100 opacity-100 text-indigo-400"
              : "-rotate-90 scale-0 opacity-0 absolute"
)}
        />
      </div>
      {showLabel && (
        <span className="text-sm sm:text-base font-medium">
          {isDark ? "Night" : "Day"}
        </span>
)}
    </button>
);
}
