import { cn } from "@/utils/cn";
import { AlertCircle } from "lucide-react";
import { forwardRef, useId } from "react";

function FieldShell({ label, helperText, error, required, counter, children }) {
  const auto = useId();
  const inputId = `f-${auto}`;
  const descId = helperText || error ? `d-${auto}` : undefined;
  return (
    <div className="w-full text-left">
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor={inputId} className="text-base font-bold tracking-[-0.005em] text-zinc-900 dark:text-zinc-100">
            {label}
            {required && <span className="ml-1 text-sm text-emerald-600 font-normal dark:text-emerald-400" aria-hidden>(required)</span>}
          </label>
          {counter && <span className="tabular text-sm font-mono text-zinc-500 dark:text-zinc-400">{counter}</span>}
        </div>
)}
      {children({ inputId, descId })}
      {(error || helperText) && (
        <p
          id={descId}
          className={cn(
            "mt-1.5 flex items-start gap-1.5 text-base font-medium leading-snug",
            error ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"
)}
          role={error ? "alert" : undefined}
        >
          {error && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />}
          {error ?? helperText}
        </p>
)}
    </div>
);
}

const fieldBase =
  "w-full rounded-[12px] border border-zinc-300 bg-white px-4 text-lg font-medium text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-all duration-200 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/30 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30";

/**
 * forwardRef so callers can focus the field programmatically (the staff sign-in
 * screen focuses the username on mount and after a failed attempt).
 */
export const Input = forwardRef(function Input(
  { label, helperText, error, counter, required, leading, className, ...props },
  ref
) {
  return (
    <FieldShell label={label} helperText={helperText} error={error} required={required} counter={counter}>
      {({ inputId, descId }) => (
        <div className="relative">
          {leading && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-500 dark:text-zinc-400">
              {leading}
            </span>
)}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={descId}
            required={required}
            className={cn(
              fieldBase,
              "h-12",
              leading && "pl-11",
              error && "border-red-500 ring-2 ring-red-500/20 dark:border-red-400",
              className
)}
            {...props}
          />
        </div>
)}
    </FieldShell>
);
});

export function Textarea({ label, helperText, error, counter, required, className, ...props }) {
  return (
    <FieldShell label={label} helperText={helperText} error={error} required={required} counter={counter}>
      {({ inputId, descId }) => (
        <textarea
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={descId}
          className={cn(
            fieldBase,
            "min-h-[128px] resize-y py-3 leading-relaxed",
            error && "border-red-500 ring-2 ring-red-500/20 dark:border-red-400",
            className
)}
          {...props}
        />
)}
    </FieldShell>
);
}
