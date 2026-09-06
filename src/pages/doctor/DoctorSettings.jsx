import { useState } from "react";
import { DoctorLayout } from "@/components/layout/DoctorLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

const TOGGLES = [
  { key: "assignment", label: "New patient assigned", desc: "When a token is issued into your queue", on: true },
  { key: "flags", label: "Flagged results", desc: "When a report value sits outside the reference range", on: true },
  { key: "reorder", label: "Queue reorders", desc: "When the desk moves a patient forward or back", on: false },
  { key: "voice", label: "Play voice alerts", desc: "Announcements through the hall speakers", on: false },
];

export default function DoctorSettings() {
  const { toast } = useToast();
  const [state, setState] = useState(
    Object.fromEntries(TOGGLES.map(t => [t.key, t.on]))
);

  return (
    <DoctorLayout>
      <div className="mx-auto max-w-2xl">
        <div className="reveal mb-5">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-ink">Settings</h1>
          <p className="mt-1 text-base text-ink/55">Profile and OPD preferences for this workstation.</p>
        </div>

        <Card padding="lg" className="reveal mb-3 border-line bg-white/55" style={{ ["--i" ]: 1 }}>
          <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-ink">Registration profile</h2>
          <p className="mt-1 text-sm sm:text-base leading-relaxed text-ink/60">
            Clinical identity is held by the hospital records office. Changes here are not accepted by the kiosk.
          </p>
          <div className="mt-4 space-y-3">
            <Input label="Name" value="Dr. Sunita Patil" disabled />
            <Input label="Qualification" value="MBBS, MD (Internal Medicine)" disabled />
            <Input label="Department" value="General Medicine" disabled />
            <Input label="Medical council registration" value="MCI/2010/12345" disabled className="font-mono" />
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
            <Badge tone="done" mark="dot">Verified for OPD 2026</Badge>
            <span className="text-sm text-ink/60">Records office, 04 Jan</span>
          </div>
        </Card>

        <Card padding="lg" className="reveal mb-3 border-line bg-white/55" style={{ ["--i" ]: 2 }}>
          <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-ink">OPD preferences</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input label="OPD start" defaultValue="09:00" type="time" />
            <Input label="OPD end" defaultValue="13:00" type="time" />
            <Input label="Patients per session" defaultValue="25" inputMode="numeric" helperText="Stops token issue once reached." />
            <Input label="Average consultation (min)" defaultValue="8" inputMode="numeric" helperText="Used only for queue estimates." />
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="md" onClick={() => toast("Preferences saved.", { detail: "Applies to the next token batch." })}>
              Save preferences
            </Button>
            <Button size="md" variant="tertiary">Reset</Button>
          </div>
        </Card>

        <Card padding="lg" className="reveal border-line bg-white/55" style={{ ["--i" ]: 3 }}>
          <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-ink">Alerts</h2>
          <ul className="mt-3 divide-y divide-line">
            {TOGGLES.map(t => (
              <li key={t.key} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-base font-medium text-ink">{t.label}</p>
                  <p className="mt-0.5 text-sm sm:text-base text-ink/60">{t.desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={state[t.key]}
                  aria-label={t.label}
                  onClick={() => {
                    setState(prev => ({ ...prev, [t.key]: !prev[t.key] }));
                    toast(`${t.label} ${state[t.key] ? "off" : "on"}.`);
                  }}
                  className={cn(
                    "relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-[420ms] [transition-timing-function:var(--ease-glide)]",
                    state[t.key] ? "border-ink bg-ink" : "border-line-strong bg-white/70"
)}
                >
                  <span
                    className={cn(
                      "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all duration-[420ms] [transition-timing-function:var(--ease-spring)]",
                      state[t.key] ? "left-[26px] bg-white" : "left-[3px] bg-ink/35"
)}
                  />
                </button>
              </li>
))}
          </ul>
        </Card>
      </div>
    </DoctorLayout>
);
}
