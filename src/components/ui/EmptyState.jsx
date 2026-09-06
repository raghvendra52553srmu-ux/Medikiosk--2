import { cn } from "@/utils/cn";

export function EmptyState({
  icon, title, description, action, secondaryAction, tone = "quiet", className,
}) {
  return (
    <div
      className={cn(
        "reveal flex flex-col items-start gap-4 rounded-[14px] border p-6 sm:p-8",
        tone === "alert"
          ? "border-dashed border-ink/25 bg-ink/[0.025]"
          : "border-dashed border-line-strong bg-white/40",
        className
)}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[11px] border border-line-strong bg-white/70 text-ink/60 backdrop-blur">
        {icon}
      </div>
      <div className="max-w-md">
        <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-ink">{title}</h3>
        <p className="mt-1.5 text-base leading-relaxed text-ink/60">{description}</p>
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center gap-2.5">
          {action}
          {secondaryAction}
        </div>
)}
    </div>
);
}
