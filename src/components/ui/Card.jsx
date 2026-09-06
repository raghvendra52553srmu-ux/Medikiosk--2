import { cn } from "@/utils/cn";

const paddings = { none: "", sm: "p-3.5", md: "p-5", lg: "p-6 sm:p-7" };

export function Card({
  children,
  padding = "md",
  interactive = false,
  as: Tag = "div",
  className,
  ...props
}) {
  return (
    <Tag
      className={cn(
        "glass rounded-[14px]",
        paddings[padding],
        interactive && "glass-hover sheen cursor-pointer hover:border-white",
        className
)}
      {...(props)}
    >
      {children}
    </Tag>
);
}

export function SectionHeading({
  title,
  meta,
  action,
  className,
}

) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <div className="min-w-0">
        <h3 className="font-display text-lg font-semibold leading-snug tracking-[-0.015em] text-ink">
          {title}
        </h3>
        {meta && <p className="mt-0.5 text-base leading-relaxed text-ink/55">{meta}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
);
}

export function Divider({ label, className }) {
  if (!label) return <div className={cn("h-px w-full bg-line", className)} />;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px flex-1 bg-line" />
      <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink/60">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
);
}
