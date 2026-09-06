import { createWorker, } from "tesseract.js";

/**
 * Client-side OCR. Runs entirely in the browser via Tesseract.js — no upload
 * of the patient's document to any server. The first call downloads the
 * language model (~2 MB) and caches it; later scans reuse the same worker.
 */

let workerPromise = null;
let progressHandler = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng", 1, {
      logger: m => {
        if (m.status && typeof m.progress === "number") {
          progressHandler?.({ status: m.status, progress: m.progress });
        }
      },
    });
  }
  return workerPromise;
}

/** Read text from an image File, Blob, or data URL. */
export async function readDocumentText(
  source,
  onProgress
) {
  progressHandler = onProgress ?? null;
  try {
    const worker = await getWorker();
    const result = await worker.recognize(source);
    return {
      text: (result.data.text ?? "").trim(),
      confidence: result.data.confidence ?? 0,
    };
  } finally {
    progressHandler = null;
  }
}

/** Turn a File into a data URL so we can preview it without re-reading. */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Pull a short, human-readable summary out of raw OCR text for the card.
 * Looks for common lab/prescription patterns; falls back to the first
 * meaningful lines so the doctor always sees *something* real.
 */
export function summariseOcrText(raw)

 {
  const text = raw.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
  const lower = text.toLowerCase();

  let type = "other";
  if (/prescription|rx\b|tab\.|tablet|capsule|mg\b|ml\b/.test(lower)) type = "prescription";
  else if (/haemoglobin|hemoglobin|sgpt|sgot|creatinine|wbc|platelet|lab\b|report|investigation/.test(lower))
    type = "lab-report";
  else if (/discharge|admission|hospital course/.test(lower)) type = "discharge-summary";
  else if (/x[\s-]?ray|ultrasound|usg|mri|ct scan|imaging/.test(lower)) type = "imaging";

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 2 && /[A-Za-z\u0900-\u097F]/.test(l));

  const heading =
    lines.find(l => l.length <= 48 && !/^\d/.test(l)) ??
    lines[0] ??
    "Scanned page";

  const dense = lines
    .filter(l => l.length > 8)
    .filter(l => /\d/.test(l) || /tab|mg|ml|u\/l|g\/dl|%|od\b|bd\b|tds\b/i.test(l))
    .slice(0, 3);

  const summary =
    dense.length > 0
      ? dense.join(" · ")
      : lines.slice(0, 3).join(" · ") || "Text was read from this page.";

  return {
    title: heading.slice(0, 60),
    type,
    summary: summary.slice(0, 220),
  };
}

/** Tear down the worker (call on leave if you want to free memory). */
export async function disposeOcr() {
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
    workerPromise = null;
  }
}
