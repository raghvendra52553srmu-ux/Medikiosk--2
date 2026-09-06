import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-emerald-600 text-white font-bold border border-emerald-500 shadow-[0_10px_28px_-14px_rgba(5,150,105,0.7)] hover:bg-emerald-500 hover:shadow-[0_16px_34px_-16px_rgba(5,150,105,0.8)] active:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-zinc-950 dark:border-emerald-400 dark:hover:bg-emerald-400",
  secondary:
    "border border-zinc-200 bg-white/90 text-zinc-900 shadow-xs hover:bg-zinc-100 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
  tertiary:
    "bg-transparent text-zinc-700 border border-transparent hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-zinc-50 dark:hover:bg-zinc-800",
  ghost:
    "bg-zinc-100 text-zinc-800 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700",
  danger:
    "bg-red-600 text-white border border-red-500 hover:bg-red-500 active:bg-red-700",
};

const sizes = {
  sm: "h-8 px-3 text-base gap-1.5 rounded-[8px]",
  md: "h-10 px-4 text-base gap-2 rounded-[10px]",
  lg: "h-12 px-5 text-lg gap-2 rounded-[12px]",
  kiosk: "h-14 px-7 text-lg font-bold gap-2.5 rounded-[14px] min-w-[13rem]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "group relative inline-flex select-none items-center justify-center font-bold tracking-[-0.01em] cursor-pointer",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
) : icon ? (
        <span className="shrink-0 transition-transform duration-200 group-hover:-translate-y-px">
          {icon}
        </span>
) : null}
      <span className={cn("truncate", loading && "opacity-80")}>{children}</span>
      {iconRight && !loading && (
        <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
          {iconRight}
        </span>
)}
    </button>
);
}
