import { Badge } from "./Badge";
import { User, FileText, Layers, ShieldCheck } from "lucide-react";

/**
 * Provenance. Each source reads differently so nothing compiled from a scan
 * looks as authoritative as something a clinician signed off on.
 */
const config = {
  "patient-stated": { label: "Patient stated", hint: "Typed or spoken at the kiosk by the patient", icon: User, emphasis: false },
  document: { label: "From document", hint: "Read from an uploaded report or prescription", icon: FileText, emphasis: false },
  "system-compiled": { label: "Compiled draft", hint: "Assembled by the kiosk from answers + documents. Not verified.", icon: Layers, emphasis: true },
  "clinician-verified": { label: "Doctor verified", hint: "Checked and signed off by the treating doctor", icon: ShieldCheck, emphasis: false },
};

export function SourceBadge({ source, className }) {
  const c = config[source];
  const Icon = c.icon;
  return (
    <Badge
      tone={c.emphasis ? "outline" : "quiet"}
      className={className}
      title={c.hint}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {c.label}
    </Badge>
);
}

export function sourceLabel(source) {
  return config[source].label;
}
