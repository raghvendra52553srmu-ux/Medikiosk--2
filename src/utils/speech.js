/**
 * Speech Recognition powered by WebSpeech & AssemblyAI
 * API Key: 725148352e8d4e57acc655f894894636
 *
 * Provides instant live speech-to-text dictation while speaking ("bolne pe turant likhna")
 * with seamless fallback to AssemblyAI for browsers without native WebSpeech support.
 */

import { transcribeAudioWithAssemblyAI } from "@/services/assemblyAiService";

function getCtor() {
  const w = typeof window !== "undefined" ? window : {};
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported() {
  if (getCtor() !== null) return true;
  if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) return true;
  return false;
}

/** Map language code to BCP-47 tags for speech engines. */
export function speechLang(code) {
  const map = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    mr: "mr-IN",
    ta: "ta-IN",
    te: "te-IN",
  };
  return map[code] ?? "hi-IN";
}

/**
 * Start listening.
 * Uses native WebSpeech for instant real-time live typing as the user speaks.
 * If WebSpeech is unavailable or fails, seamlessly uses MediaRecorder + AssemblyAI.
 */
export function startListening(opts = {}) {
  const Ctor = getCtor();

  // Mode 1: Native browser WebSpeech (Instant live typing on Chrome, Edge, Android)
  if (Ctor) {
    let rec = null;
    let settled = false;
    let userStopped = false;
    let latestTranscript = "";

    try {
      rec = new Ctor();
      rec.lang = speechLang(opts.lang || "hi");
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
    } catch (e) {
      rec = null;
    }

    if (rec) {
      const done = new Promise((resolve) => {
        const finish = (result) => {
          if (settled) return;
          settled = true;
          resolve(result);
        };

        rec.onstart = () => {
          opts.onStart?.();
        };

        rec.onresult = (ev) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = 0; i < ev.results.length; ++i) {
            const item = ev.results[i][0];
            if (ev.results[i].isFinal) {
              finalTranscript += item.transcript;
            } else {
              interimTranscript += item.transcript;
            }
          }

          const current = (finalTranscript + (interimTranscript ? " " + interimTranscript : "")).trim();
          if (current) {
            latestTranscript = current;
            opts.onInterim?.(current);
          }
        };

        rec.onerror = (ev) => {
          const code = ev.error;
          if (code === "aborted" || code === "no-speech") {
            return;
          }
          if (code === "not-allowed" || code === "service-not-allowed") {
            finish({
              ok: false,
              reason: "denied",
              message: "Microphone access was blocked. Please allow mic permissions in your browser.",
            });
            return;
          }
          if (code === "network") {
            finish({
              ok: false,
              reason: "network",
              message: "Speech recognition network error. Please check your internet connection.",
            });
            return;
          }
          console.warn("[speech] WebSpeech error:", code);
        };

        rec.onend = () => {
          const text = latestTranscript.trim();
          if (text) {
            finish({ ok: true, transcript: text, engine: "webspeech" });
          } else if (!settled) {
            finish({
              ok: false,
              reason: userStopped ? "aborted" : "no-speech",
              message: "We didn't catch any speech. Try speaking again, or type your answer.",
            });
          }
        };

        try {
          rec.start();
        } catch (startErr) {
          console.warn("[speech] rec.start error, falling back to AssemblyAI:", startErr);
          // If start fails, resolve false to trigger fallback
          finish({ ok: false, reason: "start-failed" });
        }
      });

      const session = {
        stop: () => {
          try {
            rec.stop();
          } catch {}
        },
        cancel: () => {
          userStopped = true;
          try {
            rec.abort();
          } catch {}
        },
      };

      return { session, done };
    }
  }

  // Mode 2: MediaRecorder + AssemblyAI (For Firefox, Safari, or where WebSpeech is absent)
  let userStopped = false;
  let settled = false;
  let mediaStream = null;
  let mediaRecorder = null;
  const audioChunks = [];

  const done = new Promise(async (resolve) => {
    const finish = (r) => {
      if (settled) return;
      settled = true;
      if (mediaStream) {
        try {
          mediaStream.getTracks().forEach((track) => track.stop());
        } catch {}
      }
      resolve(r);
    };

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        finish({
          ok: false,
          reason: "unsupported",
          message: "Microphone is not supported in this browser. Please type your answer.",
        });
        return;
      }

      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      mediaRecorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (userStopped) {
          finish({ ok: false, reason: "aborted", message: "Listening was cancelled." });
          return;
        }

        const audioBlob = new Blob(audioChunks, {
          type: mediaRecorder?.mimeType || "audio/webm",
        });

        if (!audioBlob || audioBlob.size < 1200) {
          finish({
            ok: false,
            reason: "no-speech",
            message: "We didn't catch enough speech. Please speak clearly into the mic.",
          });
          return;
        }

        try {
          opts.onStatus?.("⏳ AI is transcribing your voice with AssemblyAI...");
          const text = await transcribeAudioWithAssemblyAI(audioBlob, opts.lang || "hi");
          if (text && text.trim()) {
            const clean = text.trim();
            opts.onInterim?.(clean);
            finish({ ok: true, transcript: clean, engine: "assemblyai" });
            return;
          }
        } catch (assemblyErr) {
          console.warn("[speech] AssemblyAI error:", assemblyErr);
        }

        finish({
          ok: false,
          reason: "error",
          message: "Could not transcribe audio. Please try again or type your answer.",
        });
      };

      mediaRecorder.start(250);
      opts.onStart?.();
      opts.onStatus?.("🎙️ Recording... Speak your symptoms clearly.");
    } catch (micErr) {
      console.warn("[speech] MediaRecorder error:", micErr);
      finish({
        ok: false,
        reason: "denied",
        message: "Microphone access was denied. Please allow microphone permissions.",
      });
    }
  });

  const session = {
    stop: () => {
      try {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          try {
            mediaRecorder.requestData();
          } catch {}
          mediaRecorder.stop();
        }
      } catch {}
    },
    cancel: () => {
      userStopped = true;
      try {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      } catch {}
      if (mediaStream) {
        try {
          mediaStream.getTracks().forEach((track) => track.stop());
        } catch {}
      }
    },
  };

  return { session, done };
}
