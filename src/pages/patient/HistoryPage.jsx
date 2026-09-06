import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { ProgressTicks } from "@/components/ui/ProgressSteps";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAnswers, getHistoryQuestions, hasActiveSession, saveAnswer } from "@/services/patientService";

import { errorMessage } from "@/services/apiClient";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/context/AppContext";


import { cn } from "@/utils/cn";
import { speechSupported, startListening, } from "@/utils/speech";
import { ArrowLeft, ArrowRight, Check, Mic, Square, TriangleAlert } from "lucide-react";

/** Numeric scale points ("2", "3", "4") are shown as-is; everything else is a key. */
const asOption = (t, key) =>
  /^\d+$/.test(key) ? key : t(key);

export default function HistoryPage() {
  const navigate = useNavigate();
  const { t, language } = useApp();
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [answers, setAnswers] = useState({});
  const [voice, setVoice] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [loading, setLoading] = useState(true);
  const timers = useRef([]);
  const sessionRef = useRef(null);

  useEffect(() => {
    // The interview belongs to a registered visit; without one there is nothing
    // to attach answers to.
    if (!hasActiveSession()) {
      navigate("/patient/registration", { replace: true });
      return;
    }

    let alive = true;
    // Answers already given are restored from the server, so the interview
    // survives a refresh, a timeout, or the patient stepping away.
    Promise.all([getHistoryQuestions(), getAnswers().catch(() => ({}))])
      .then(([qs, restored]) => {
        if (!alive) return;
        setQuestions(qs);
        setAnswers(restored);

        // Pre-fill the text box if Q1 already has a saved typed/spoken answer.
        const first = qs[0];
        if (first) {
          const a = restored[first.id];
          if (typeof a === "string") setTranscript(a);
        }
        setLoading(false);
      })
      .catch(err => {
        if (!alive) return;
        toast(errorMessage(err), { tone: "flag" });
        setLoading(false);
      });
    return () => {
      alive = false;
      timers.current.forEach(id => window.clearTimeout(id));
      sessionRef.current?.cancel();
      sessionRef.current = null;
    };
  }, []);

  const wait = (ms, fn) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  const question = questions[cursor];
  const answeredCount = useMemo(
    () =>
      questions.filter(q => {
        const a = answers[q.id];
        return Array.isArray(a) ? a.length > 0 : Boolean(a && String(a).trim());
      }).length,
    [questions, answers]
);

  if (loading || !question) {
    return (
      <KioskLayout step={{ current: 6, total: 8, label: "History" }}>
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-4 h-9 w-3/4" />
        <div className="mt-7 space-y-2.5">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-[13px]" />)}
        </div>
      </KioskLayout>
);
  }

  const isLast = cursor === questions.length - 1;
  const currentAnswer = answers[question.id];
  const hasAnswer =
    question.type === "text"
      ? Boolean(transcript.trim() || (typeof currentAnswer === "string" && currentAnswer.trim()))
      : Array.isArray(currentAnswer)
      ? currentAnswer.length > 0
      : Boolean(currentAnswer);

  /**
   * Optimistic: the UI advances immediately (a kiosk must never feel laggy) and
   * the answer is persisted in the background. A failure is surfaced rather than
   * swallowed, so the patient is never told something was saved when it was not.
   */
  const commit = (value) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
    void saveAnswer(question.id, value).catch(err => {
      toast(errorMessage(err), {
        tone: "flag",
        detail: "That answer was not saved. Please check the connection and try again.",
      });
    });
  };

  const toggle = (label) => {
    if (question.type === "multi-choice") {
      const list = Array.isArray(currentAnswer) ? currentAnswer : [];
      commit(list.includes(label) ? list.filter(o => o !== label) : [...list, label]);
    } else {
      commit(label);
    }
    if (question.type === "single-choice" || question.type === "scale") {
      wait(280, () => go(1));
    }
  };

  const stopMic = () => {
    sessionRef.current?.cancel();
    sessionRef.current = null;
  };

  const go = (delta) => {
    stopMic();
    setVoice("idle");
    setVoiceError("");

    // Free-text answers live in `transcript` until something commits them.
    // Without this, typing an answer and pressing Next silently discarded it —
    // choice questions were saved on tap, but text ones never were.
    if (question?.type === "text" || question?.type === "scale") {
      const typed = transcript.trim();
      if (typed && typed !== currentAnswer) commit(typed);
    }

    const nextIdx = Math.min(questions.length - 1, Math.max(0, cursor + delta));
    const nextQ = questions[nextIdx];
    const saved = nextQ ? answers[nextQ.id] : undefined;
    setTranscript(typeof saved === "string" ? saved : "");
    setCursor(nextIdx);
  };

  const finish = () => {
    stopMic();
    if (question.type === "text") commit(transcript.trim() || String(currentAnswer ?? ""));
    navigate("/patient/documents");
  };

  const runVoice = async () => {
    // Tap while listening → stop and keep whatever was captured.
    if (voice === "listening") {
      sessionRef.current?.stop();
      return;
    }
    if (voice === "processing") return;

    if (!speechSupported()) {
      setVoice("error");
      setVoiceError(
        "This browser cannot listen to speech. Please type your answer, or open the kiosk in Chrome or Edge."
);
      return;
    }

    setVoiceError("");
    setTranscript("");
    setVoice("listening");

    const { session, done } = startListening({
      lang: language.code,
      // Live partial text appears in the answer box as the patient speaks.
      onInterim: text => setTranscript(text),
    });
    sessionRef.current = session;

    const result = await done;
    sessionRef.current = null;

    if (result.ok) {
      const heard = result.transcript.trim();
      setTranscript(heard);
      setVoice("processing");
      // Brief pause so the patient sees "Converting…" then the final words.
      wait(350, () => {
        setVoice("recognized");
        commit(heard);
      });
    } else {
      // Keep any partial text so the patient can edit it rather than start over.
      setVoice("error");
      setVoiceError(result.message);
    }
  };

  const voiceCopy = {
    idle: { title: t("hist.voiceIdle"), hint: t("hist.voiceIdleHint") },
    listening: { title: t("hist.voiceListening"), hint: t("hist.voiceListeningHint") },
    processing: { title: t("hist.voiceProcessing"), hint: t("hist.voiceProcessingHint") },
    recognized: { title: t("hist.voiceHeard"), hint: t("hist.voiceHeardHint") },
    error: { title: t("hist.voiceError"), hint: t("hist.voiceErrorHint") },
  };
  const copy = voiceCopy[voice];
  const optionKeys = question.optionKeys ?? [];

  return (
    <KioskLayout
      step={{ current: 6, total: 8, label: "History" }}
      aside={
        <Badge tone="neutral">
          {t("hist.answered", { done: answeredCount, total: questions.length })}
        </Badge>
      }
    >
      <div className="glass-strong rounded-[18px] p-5 sm:p-7">
        <ProgressTicks
          total={questions.length}
          current={cursor}
          label={t("hist.questionOf", { n: cursor + 1, total: questions.length })}
          className="mb-6"
        />

        <p className="font-mono text-sm uppercase tracking-[0.18em] text-ink/60">
          {t("hist.questionOf", {
            n: String(question.questionNumber).padStart(2, "0"),
            total: question.totalQuestions,
          })}
        </p>
        <h1 className="mt-2.5 font-display text-3xl font-semibold leading-[1.25] tracking-[-0.03em] text-ink sm:text-4xl md:text-5xl">
          {t(question.textKey)}
        </h1>
        {question.type === "multi-choice" && (
          <p className="mt-2 text-base text-ink/60">{t("hist.pickMany")}</p>
)}

        {optionKeys.length > 0 && (
          <div
            className={cn(
              "mt-6 grid gap-2.5",
              question.type === "scale" ? "grid-cols-2 sm:grid-cols-5" : "sm:grid-cols-2"
)}
          >
            {optionKeys.map((key, i) => {
              const label = asOption(t, key);
              const selected = Array.isArray(currentAnswer)
                ? currentAnswer.includes(label)
                : currentAnswer === label;
              return (
                <button
                  key={key}
                  onClick={() => toggle(label)}
                  style={{ ["--i" ]: i }}
                  aria-pressed={selected}
                  className={cn(
                    "reveal group flex min-h-[60px] items-center gap-3 rounded-[14px] border-2 px-4 py-3 text-left cursor-pointer",
                    "transition-all duration-150 active:scale-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    selected
                      ? "border-emerald-500 bg-emerald-600 text-white font-bold shadow-md ring-2 ring-emerald-500/30 dark:bg-emerald-500 dark:text-zinc-950"
                      : "border-zinc-200 bg-white/95 text-zinc-900 hover:border-emerald-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:border-emerald-400"
)}
                >
                  <span className="flex-1 text-lg font-bold leading-snug">{label}</span>
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                      selected
                        ? "scale-100 border-white bg-white/25 text-white dark:border-zinc-950 dark:bg-zinc-950/20 dark:text-zinc-950"
                        : "scale-90 border-zinc-300 opacity-0 group-hover:opacity-100 dark:border-zinc-600"
)}
                  >
                    {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                </button>
);
            })}
          </div>
)}

        {question.type === "text" && (
          <div className="mt-6">
            <Textarea
              label={t("hist.yourAnswer")}
              placeholder={t("hist.typeHint")}
              value={transcript}
              onChange={e => {
                setTranscript(e.target.value);
                if (voice === "recognized" || voice === "error") {
                  setVoice("idle");
                  setVoiceError("");
                }
              }}
              counter={t("hist.characters", { n: transcript.length })}
            />
          </div>
)}

        {/* Voice lane */}
        <div className="mt-5 border-t border-line pt-5">
          <button
            onClick={runVoice}
            className={cn(
              "group flex w-full items-center gap-4 rounded-[14px] border-2 border-dashed p-4 text-left transition-all duration-[420ms] [transition-timing-function:var(--ease-glide)]",
              voice === "listening" && "border-ink/55 bg-ink/[0.05]",
              voice === "processing" && "border-ink/30 bg-ink/[0.03]",
              voice === "recognized" && "border-ink/40 bg-white/70",
              voice === "error" && "border-ink/50 bg-white/70",
              voice === "idle" && "border-line-strong bg-white/40 hover:border-ink/35 hover:bg-white/65"
)}
            aria-live="polite"
          >
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all duration-[420ms]",
                voice === "listening"
                  ? "animate-pulse-ring border-ink bg-ink text-white"
                  : voice === "idle"
                  ? "border-ink/20 bg-white/70 text-ink/70 group-hover:border-ink/45 group-hover:text-ink"
                  : "border-ink/25 bg-white/70 text-ink"
)}
            >
              {voice === "listening" ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base md:text-lg font-medium text-ink">{copy.title}</span>
              <span className="mt-0.5 block text-sm sm:text-base text-ink/55">{copy.hint}</span>
            </span>
            {voice === "processing" && (
              <span className="flex shrink-0 items-end gap-[3px]" aria-hidden>
                {[0, 1, 2, 3].map(n => (
                  <span
                    key={n}
                    className="w-[3px] rounded-full bg-ink/60"
                    style={{
                      height: `${8 + ((n * 7) % 16)}px`,
                      animation: `shimmer 900ms var(--ease-in-out-soft) ${n * 120}ms infinite`,
                    }}
                  />
))}
              </span>
)}
            {voice === "error" && <TriangleAlert className="h-4.5 w-4.5 shrink-0 text-ink" />}
          </button>

          {voice === "error" && (
            <p className="mt-2.5 text-base leading-relaxed text-ink/65">
              {voiceError || t("hist.errorHelp")}
            </p>
)}

          {voice === "recognized" && transcript && (
            <div className="reveal mt-3 rounded-[12px] border border-ink/15 bg-white/70 p-3.5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/60">
                {t("hist.heardTitle")}
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-ink">{transcript}</p>
              <div className="mt-2.5 flex gap-3">
                <button
                  onClick={() => {
                    setVoice("idle");
                    setTranscript("");
                    setVoiceError("");
                    commit("");
                  }}
                  className="text-sm sm:text-base font-medium text-ink/60 underline decoration-ink/25 underline-offset-4 hover:text-ink hover:decoration-ink"
                >
                  {t("hist.discard")}
                </button>
                <button
                  onClick={() => {
                    commit(transcript.trim());
                    setVoice("idle");
                    setVoiceError("");
                  }}
                  className="text-sm sm:text-base font-medium text-ink underline decoration-ink/40 underline-offset-4"
                >
                  {t("hist.keep")}
                </button>
              </div>
            </div>
)}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => go(-1)}
          disabled={cursor === 0}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          {t("hist.previous")}
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={isLast ? finish : () => go(1)}
          disabled={!hasAnswer}
          iconRight={isLast ? undefined : <ArrowRight className="h-4 w-4" />}
        >
          {isLast ? t("hist.finish") : t("hist.next")}
        </Button>
      </div>

      <p className="mt-3 text-sm sm:text-base leading-relaxed text-ink/60">{t("hist.footer")}</p>
    </KioskLayout>
);
}
