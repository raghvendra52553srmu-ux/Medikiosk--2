import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { clearClinic } from "@/services/patientService";
import { Clock, Phone, Mic, CircleHelp, Languages, ShieldCheck, X } from "lucide-react";

/**
 * A kiosk stands in a public corridor. If the patient walks away mid-visit we
 * clear the screen rather than leave their details on it.
 */
const IDLE_WARNING_MS = 120_000;
const GRACE_SECONDS = 30;

export function SessionWatch({ onEnd }) {
  const [phase, setPhase] = useState("idle");
  const [secondsLeft, setSecondsLeft] = useState(GRACE_SECONDS);

  useEffect(() => {
    let last = Date.now();
    let timer = 0;

    const bump = () => {
      last = Date.now();
      if (phase !== "idle") {
        setPhase("idle");
        setSecondsLeft(GRACE_SECONDS);
      }
    };

    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach(e => window.addEventListener(e, bump, { passive: true, capture: true }));

    timer = window.setInterval(() => {
      const idleFor = Date.now() - last;
      if (idleFor > IDLE_WARNING_MS + GRACE_SECONDS * 1000) {
        setPhase("ended");
      } else if (idleFor > IDLE_WARNING_MS) {
        setPhase(p => (p === "warning" ? p : "warning"));
        setSecondsLeft(Math.max(0, Math.ceil((IDLE_WARNING_MS + GRACE_SECONDS * 1000 - idleFor) / 1000)));
      }
    }, 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, bump, { capture: true }));
      window.clearInterval(timer);
    };
  }, [phase]);

  const endNow = () => {
    clearClinic();
    setPhase("idle");
    setSecondsLeft(GRACE_SECONDS);
    onEnd();
  };

  return (
    <>
      <Dialog
        open={phase === "warning"}
        onClose={endNow}
        dismissible={false}
        title="Are you still there?"
        description="This kiosk is in a public area, so we clear the screen if you step away."
      >
        <div className="mb-5 flex items-center gap-2.5 rounded-[10px] border border-line bg-white/70 px-3.5 py-2.5">
          <Clock className="h-4 w-4 shrink-0 text-ink/60" />
          <p className="text-base text-ink/70">
            Screen resets in <span className="tabular font-semibold text-ink">{secondsLeft}s</span>
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="tertiary" size="lg" onClick={endNow}>End and clear</Button>
          <Button size="lg" onClick={endNow} data-autofocus>I'm still here</Button>
        </div>
      </Dialog>

      <Dialog open={phase === "ended"} onClose={endNow} dismissible={false} title="Session ended for your privacy">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
          <p className="text-base leading-relaxed text-ink/65">
            Everything you entered on this screen has been cleared. Nothing was left visible for the next person.
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <Button size="lg" onClick={endNow} data-autofocus>Start again</Button>
        </div>
      </Dialog>
    </>
);
}

const TOPICS = [
  {
    icon: Mic,
    title: "Speaking instead of typing",
    body: "Tap “Speak your answer” on any question and say it out loud in your own language. You can also tap a choice instead of speaking.",
  },
  {
    icon: ShieldCheck,
    title: "What the queue board shows",
    body: "Only the token number. Your name, your answers and your reports never appear on any public screen.",
  },
  {
    icon: CircleHelp,
    title: "No documents and no reports?",
    body: "That is fine. Continue without them — the doctor will still read your answers and can ask for papers during the visit.",
  },
];

export function HelpPanel({ open, onClose }) {
  const { language, languages, setLanguage } = useApp();

  return (
    <div className={open ? "" : "pointer-events-none"} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-500 [transition-timing-function:var(--ease-glide)] ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Help and language"
        className={`glass-strong fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col transition-transform duration-[520ms] [transition-timing-function:var(--ease-glide)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">Help</h2>
            <p className="mt-0.5 text-sm text-ink/60">Anything here is in your chosen language</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink/60 transition-colors hover:bg-ink/[0.06] hover:text-ink"
            aria-label="Close help"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-[0.16em] text-ink/60">
              <Languages className="h-3.5 w-3.5" /> Language
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language.code === lang.code}
                  className={`h-12 rounded-[10px] border text-base transition-all duration-[320ms] [transition-timing-function:var(--ease-glide)] ${
                    language.code === lang.code
                      ? "border-ink bg-ink font-medium text-white shadow-[0_10px_24px_-14px_rgba(11,11,12,0.8)]"
                      : "border-line-strong bg-white/55 text-ink/75 hover:border-ink/30 hover:bg-white/85"
                  }`}
                >
                  {lang.nativeLabel}
                </button>
))}
            </div>
          </section>

          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink/60">
              Common questions
            </h3>
            {TOPICS.map(topic => (
              <div
                key={topic.title}
                className="glass-hover rounded-[12px] border border-line bg-white/50 p-3.5"
              >
                <div className="flex items-center gap-2">
                  <topic.icon className="h-4 w-4 shrink-0 text-ink/55" />
                  <p className="text-base font-medium text-ink">{topic.title}</p>
                </div>
                <p className="mt-1.5 text-base leading-relaxed text-ink/60">{topic.body}</p>
              </div>
))}
          </section>
        </div>

        <div className="border-t border-line p-5">
          <div className="flex items-center gap-3 rounded-[12px] border border-line bg-white/60 p-3.5">
            <Phone className="h-4 w-4 shrink-0 text-ink" />
            <div className="min-w-0">
              <p className="text-base font-medium text-ink">Counter staff can help you</p>
              <p className="text-sm text-ink/55">Extension 1042 · OPD desk, ground floor</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
);
}
