/**
 * Speech Recognition powered by AssemblyAI & WebSpeech
 * API Key: 725148352e8d4e57acc655f894894636
 *
 * Dual-engine voice recognition:
 * 1. Live real-time speech preview via browser engine (instant feedback)
 * 2. High-accuracy multilingual AI transcription via AssemblyAI ("jise jo bole vahi uthaye")
 * 3. Resilient fallback so speech is NEVER lost.
 */

import { transcribeAudioWithAssemblyAI } from "@/services/assemblyAiService";

function getCtor() {
  const w = typeof window !== "undefined" ? window : {};
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported() {
  if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
    return true;
  }
  return getCtor() !== null;
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
 * Captures microphone audio using MediaRecorder for AssemblyAI transcription
 * while simultaneously showing live interim text.
 */
export function startListening(opts = {}) {
  let userStopped = false;
  let settled = false;
  let browserFinalText = "";
  let mediaStream = null;
  let mediaRecorder = null;
  const audioChunks = [];

  const Ctor = getCtor();
  const rec = Ctor ? new Ctor() : null;

  if (rec) {
    rec.lang = speechLang(opts.lang);
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
  }

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

    // 1. Request microphone access for AssemblyAI recording
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // Pick best supported MIME type
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

        mediaRecorder.start(250); // Collect slices every 250ms
      }
    } catch (micErr) {
      console.warn("[speech] MediaRecorder init error, falling back to WebSpeech:", micErr);
    }

    opts.onStart?.();

    // 2. Set up browser live interim text display (if supported)
    if (rec) {
      rec.onresult = (ev) => {
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const piece = ev.results[i][0].transcript;
          if (ev.results[i].isFinal) {
            browserFinalText = (browserFinalText ? browserFinalText + " " : "") + piece.trim();
          } else {
            interim = (interim ? interim + " " : "") + piece.trim();
          }
        }
        const live = (browserFinalText + (interim ? " " + interim : "")).trim();
        if (live) opts.onInterim?.(live);
      };

      rec.onerror = (ev) => {
        const code = ev.error;
        if (code === "aborted" || code === "no-speech") return;
        console.warn("[speech] WebSpeech event error:", code);
      };

      rec.onend = () => {
        // Auto-stop media recorder if speech pauses
        if (mediaRecorder && mediaRecorder.state === "recording") {
          try {
            mediaRecorder.requestData();
            mediaRecorder.stop();
          } catch {}
        }
      };

      try {
        rec.start();
      } catch (err) {
        console.warn("[speech] WebSpeech start error:", err);
      }
    }

    // 3. Transcription processor when recording finishes
    const processAudioAndFinish = async () => {
      let audioBlob = null;
      if (audioChunks.length > 0) {
        const type = mediaRecorder?.mimeType || "audio/webm";
        audioBlob = new Blob(audioChunks, { type });
      }

      // Try AssemblyAI first if audio was recorded
      if (audioBlob && audioBlob.size > 1000 && !userStopped) {
        try {
          opts.onStatus?.("⏳ Transcribing audio with AssemblyAI...");
          const assemblyText = await transcribeAudioWithAssemblyAI(
            audioBlob,
            opts.lang || "hi"
          );

          if (assemblyText && assemblyText.trim()) {
            const cleanText = assemblyText.trim();
            opts.onInterim?.(cleanText);
            finish({
              ok: true,
              transcript: cleanText,
              engine: "assemblyai",
            });
            return;
          }
        } catch (assemblyErr) {
          console.warn(
            "[speech] AssemblyAI transcription error, falling back to browser text:",
            assemblyErr
          );
        }
      }

      // Fallback to browser transcribed text if AssemblyAI was skipped or failed
      const text = (browserFinalText || "").trim();
      if (text) {
        finish({ ok: true, transcript: text, engine: "webspeech" });
      } else if (!settled) {
        finish({
          ok: false,
          reason: userStopped ? "aborted" : "no-speech",
          message: "We didn't catch any speech. Try again, or type your answer.",
        });
      }
    };

    // Handle recorder stop
    if (mediaRecorder) {
      mediaRecorder.onstop = () => {
        void processAudioAndFinish();
      };
    } else if (rec) {
      rec.onend = () => {
        void processAudioAndFinish();
      };
    } else {
      finish({
        ok: false,
        reason: "unsupported",
        message: "Microphone is not supported in this browser. Please type your answer.",
      });
    }
  });

  const session = {
    stop: () => {
      try {
        if (rec) rec.stop();
      } catch {}
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
        if (rec) rec.abort();
      } catch {}
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
