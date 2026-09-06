/**
 * Thin wrapper around the browser Web Speech API (SpeechRecognition /
 * webkitSpeechRecognition). Returns what the patient actually said.
 *
 * Supported in Chrome, Edge, Safari. Unsupported browsers get a clear error
 * so the UI can fall back to typing.
 */

function getCtor() {
  const w = window

;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported() {
  return getCtor() !== null;
}

/** Map our language codes to BCP-47 tags the Speech API understands. */
export function speechLang(code) {
  const map = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    mr: "mr-IN",
    ta: "ta-IN",
    te: "te-IN",
  };
  return map[code] ?? "en-IN";
}

/**
 * Start listening. Calls `onInterim` with live partial text, then resolves
 * with the final transcript (or a typed error).
 */
export function startListening(opts

) {
  const Ctor = getCtor();
  if (!Ctor) {
    return {
      session: { stop: () => {}, cancel: () => {} },
      done: Promise.resolve({
        ok: false,
        reason: "unsupported",
        message: "This browser cannot listen. Please type your answer instead.",
      }),
    };
  }

  const rec = new Ctor();
  rec.lang = speechLang(opts.lang);
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let settled = false;
  let finalText = "";
  let userStopped = false;

  const done = new Promise(resolve => {
    const finish = (r) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    rec.onstart = () => opts.onStart?.();

    rec.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const piece = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      const live = (finalText + interim).trim();
      if (live) opts.onInterim?.(live);
    };

    rec.onerror = (ev) => {
      const code = ev.error;
      if (code === "aborted" || code === "no-speech") {
        // If the user already stopped and we have text, treat as success below
        // in onend. Otherwise surface a typed failure.
        if (!userStopped || !finalText.trim()) {
          finish({
            ok: false,
            reason: code === "no-speech" ? "no-speech" : "aborted",
            message:
              code === "no-speech"
                ? "We didn't catch any speech. Try again, or type your answer."
                : "Listening was cancelled.",
          });
        }
        return;
      }
      if (code === "not-allowed" || code === "service-not-allowed") {
        finish({
          ok: false,
          reason: "denied",
          message: "Microphone access was blocked. Allow it in the browser, or type your answer.",
        });
        return;
      }
      if (code === "network") {
        finish({
          ok: false,
          reason: "network",
          message: "Speech recognition needs a network connection. Check your internet, or type your answer.",
        });
        return;
      }
      finish({
        ok: false,
        reason: "error",
        message: "Could not understand that. Try again, or type your answer.",
      });
    };

    rec.onend = () => {
      const text = finalText.trim();
      if (text) {
        finish({ ok: true, transcript: text });
      } else if (!settled) {
        finish({
          ok: false,
          reason: userStopped ? "aborted" : "no-speech",
          message: "We didn't catch any speech. Try again, or type your answer.",
        });
      }
    };

    try {
      rec.start();
    } catch {
      finish({
        ok: false,
        reason: "error",
        message: "Could not start the microphone. Try again, or type your answer.",
      });
    }
  });

  const session = {
    stop: () => {
      userStopped = true;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    },
    cancel: () => {
      userStopped = true;
      try {
        rec.abort();
      } catch {
        /* already stopped */
      }
    },
  };

  return { session, done };
}
