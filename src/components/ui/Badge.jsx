import { cn } from "@/utils/cn";

const tones = {
  neutral: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
  solid:   "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100",
  outline: "bg-white/60 text-zinc-700 border-zinc-300 dark:bg-zinc-800/60 dark:text-zinc-200 dark:border-zinc-600",
  flag:    "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60",
  quiet:   "bg-transparent text-zinc-500 border-zinc-200 dark:text-zinc-400 dark:border-zinc-700",
  done:    "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500 dark:text-zinc-950",
};

export function Badge({ tone = "neutral", children, mark = "none", className, title }) {
  const inverted = tone === "solid" || tone === "done";
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-sm font-medium leading-[1.45] tracking-[0.01em]",
        "transition-colors duration-300 [transition-timing-function:var(--ease-glide)]",
        tones[tone],
        className
)}
    >
      {mark === "dot" && (
        <span className={cn("h-1.5 w-1.5 rounded-full", inverted ? "bg-white dark:bg-zinc-950" : "bg-zinc-700 dark:bg-zinc-300")} aria-hidden />
)}
      {mark === "ring" && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full border", inverted ? "border-white/70 dark:border-zinc-900/70" : "border-zinc-500 dark:border-zinc-400")}
          aria-hidden
        />
)}
      {children}
    </span>
);
}
