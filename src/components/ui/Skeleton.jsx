import { cn } from "@/utils/cn";

export function Skeleton({ className }) {
  return <div className={cn("skeleton rounded-[8px]", className)} aria-hidden="true" />;
}

export function SkeletonFacility() {
  return (
    <div className="glass rounded-[14px] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-[18px] w-2/5" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-1/4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-9 -mx-5 -mb-5 rounded-b-[14px]" />
    </div>
);
}

export function SkeletonList({ count = 4, className }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ ["--i" ]: i }} className="reveal" >
          <SkeletonFacility />
        </div>
))}
      <span className="sr-only">Loading…</span>
    </div>
);
}

export function SkeletonRows({ rows = 6, cols = 6 }) {
  return (
    <div className="glass overflow-hidden rounded-[14px]" role="status" aria-label="Loading table">
      <div className="flex gap-4 border-b border-line bg-ink/[0.02] px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line/70 px-4 py-3.5 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-3.5 flex-1", c === 0 && "max-w-[68px]")} />
))}
        </div>
))}
      <span className="sr-only">Loading…</span>
    </div>
);
}
