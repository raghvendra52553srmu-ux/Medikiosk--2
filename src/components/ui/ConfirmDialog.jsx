import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

/**
 * Confirmation for actions that cannot be undone from the UI — marking a patient
 * absent removes them from today's line, so it should never be one stray tap.
 * Built on the existing Dialog so focus trapping and Escape behaviour are shared.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}

) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description} dismissible={!busy}>
      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <Button variant="secondary" size="md" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          data-autofocus
          variant={destructive ? "primary" : "primary"}
          size="md"
          onClick={onConfirm}
          disabled={busy}
          className={destructive ? "!bg-red-600 hover:!bg-red-500 dark:!bg-red-600 dark:!text-white" : undefined}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Dialog>
);
}
