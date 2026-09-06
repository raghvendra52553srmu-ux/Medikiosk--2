import { cn } from "@/utils/cn";

/**
 * Ticks rather than a percentage bar: on a 12-question interview the patient
 * needs to see how many remain, not an abstract fill.
 */
export function ProgressTicks({ total, current, className, label }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="flex flex-1 items-center gap-[3px]"
        role="img"
        aria-label={label ?? `${current} of ${total} complete`}
      >
        {Array.from({ length: total }).map((_, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <span
              key={i}
              className={cn(
                "h-[3px] flex-1 rounded-full transition-all duration-[520ms] [transition-timing-function:var(--ease-glide)]",
                done && "bg-ink",
                active && "scale-y-[1.9] bg-ink/55",
                !done && !active && "bg-ink/12"
)}
            />
);
        })}
      </div>
      <span className="tabular shrink-0 text-sm font-medium text-ink/60">
        {String(current).padStart(2, "0")}
        <span className="text-ink/25"> / {String(total).padStart(2, "0")}</span>
      </span>
    </div>
);
}
