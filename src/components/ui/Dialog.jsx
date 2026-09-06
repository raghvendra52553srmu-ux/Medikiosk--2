import { useEffect, useRef, } from "react";
import { cn } from "@/utils/cn";

export function Dialog({
  open, onClose, title, description, children, className, dismissible = true,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("[data-autofocus]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div
        className="animate-blur-in absolute inset-0 bg-ink/35 backdrop-blur-[3px]"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "glass-strong animate-rise relative w-full max-w-md rounded-[16px] p-6",
          className
)}
      >
        <h2 className="font-display text-xl md:text-2xl font-semibold leading-snug tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-base leading-relaxed text-ink/60">{description}</p>
)}
        <div className="mt-5">{children}</div>
      </div>
    </div>
);
}
