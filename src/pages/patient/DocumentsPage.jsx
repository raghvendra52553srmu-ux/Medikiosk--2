import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { addDocument, deleteDocument, getDocuments, hasActiveSession } from "@/services/patientService";
import { errorMessage } from "@/services/apiClient";

import { cn } from "@/utils/cn";
import { fileToDataUrl, readDocumentText, summariseOcrText } from "@/utils/ocr";
import {
  ArrowRight, Camera, FileText, Image as ImageIcon, Loader2,
  Paperclip, TriangleAlert, Trash2, Upload,
} from "lucide-react";



const typeIcon = {
  prescription: FileText,
  "lab-report": FileText,
  "discharge-summary": FileText,
  imaging: ImageIcon,
  other: Paperclip,
};

const STAGE_LABEL = {
  capturing: "Opening the page…",
  reading: "Reading the text on the page…",
  extracting: "Pulling out dates, tests and medicines…",
};

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [failMessage, setFailMessage] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [preview, setPreview] = useState(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let alive = true;
    if (!hasActiveSession()) {
      navigate("/patient/registration", { replace: true });
      return;
    }
    getDocuments().then(d => {
      if (alive) {
        setDocs(d);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const processFile = async (file) => {
    if (busyRef.current) return;
    if (!file.type.startsWith("image/")) {
      setStage("failed");
      setFailMessage("Please capture or choose an image (JPG, PNG). PDFs are not supported on this kiosk yet.");
      return;
    }
    // Guard against multi-megabyte camera dumps that lock up a low-end kiosk.
    if (file.size > 12 * 1024 * 1024) {
      setStage("failed");
      setFailMessage("That image is too large. Move a little farther from the page and try again.");
      return;
    }

    busyRef.current = true;
    setFailMessage("");
    setOcrProgress(0);
    setStage("capturing");

    try {
      const dataUrl = await fileToDataUrl(file);
      setStage("reading");

      const { text, confidence } = await readDocumentText(file, p => {
        // Map Tesseract's 0..1 progress onto our stage bar.
        setOcrProgress(Math.max(0.05, Math.min(0.95, p.progress)));
        if (p.status === "recognizing text" && p.progress > 0.7) setStage("extracting");
      });

      setStage("extracting");
      setOcrProgress(0.97);

      // Too little text or very low confidence → treat as a failed read so the
      // patient can retake rather than attach garbage to the visit.
      const meaningful = text.replace(/\s+/g, " ").trim();
      if (meaningful.length < 12 || confidence < 25) {
        setStage("failed");
        setFailMessage(
          confidence < 25
            ? "The page was too blurred or poorly lit to read. Hold it flat under good light and retake."
            : "Almost no text was found on this page. Make sure the whole report is in frame and try again."
);
        busyRef.current = false;
        return;
      }

      const { title, type, summary } = summariseOcrText(meaningful);
      // The page itself is never uploaded — only the text Tesseract read on this
      // device, plus a downscaled thumbnail so the doctor can eyeball the source.
      const thumb = await downscaleDataUrl(dataUrl, 640, 0.6);

      const saved = await addDocument({
        name: title,
        type: TYPE_TO_API[type],
        extractedText: summary,
        ocrConfidence: Math.round(confidence),
        thumbDataUrl: thumb,
      });

      setDocs(prev => [saved, ...prev]);
      setStage("done");
      setOcrProgress(1);
      toast("Document added to this visit.", {
        detail: `${Math.round(confidence)}% read confidence · ${type.replace("-", " ")}`,
      });
      window.setTimeout(() => {
        setStage("idle");
        setOcrProgress(0);
        busyRef.current = false;
      }, 1400);
    } catch (err) {
      setStage("failed");
      setFailMessage(
        (err)?.message ||
          "Could not read this page. Check your connection (the first scan downloads a small language model) and try again."
);
      busyRef.current = false;
    }
  };

  const onFileChosen = (e) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected after a failed read.
    e.target.value = "";
    if (file) void processFile(file);
  };

  const remove = async (doc) => {
    setConfirmRemove(null);
    const previous = docs;
    // Optimistic removal, rolled back if the server rejects it.
    setDocs(prev => prev.filter(d => d.id !== doc.id));
    try {
      await deleteDocument(doc.id);
      toast("Document removed.", { detail: `${doc.name} is no longer attached to this visit.` });
    } catch (err) {
      setDocs(previous);
      toast(errorMessage(err), { tone: "flag" });
    }
  };

  const busy = stage !== "idle" && stage !== "done" && stage !== "failed";
  const progress =
    stage === "done" ? 1
    : stage === "capturing" ? 0.08
    : stage === "reading" ? Math.max(0.12, ocrProgress * 0.75)
    : stage === "extracting" ? Math.max(0.8, ocrProgress)
    : 0;

  return (
    <KioskLayout
      title="Previous reports"
      intro="Old prescriptions, lab reports or discharge papers. If you don't have them, continue — nothing is blocked."
      step={{ current: 7, total: 8, label: "Records" }}
      stickyFooter={
        <Button
          size="kiosk"
          fullWidth
          onClick={() => navigate("/patient/review")}
          iconRight={<ArrowRight className="h-4 w-4" />}
          disabled={busy}
        >
          Continue to review
        </Button>
      }
    >
      {/* Hidden inputs — camera prefers the environment lens on phones/kiosks */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChosen}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChosen}
      />

      <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr]">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={busy}
          className="glass-hover sheen group flex items-center gap-4 rounded-[15px] border border-ink/15 bg-white/70 p-5 text-left disabled:opacity-55"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-ink text-white transition-transform duration-[520ms] [transition-timing-function:var(--ease-spring)] group-hover:-rotate-6">
            <Camera className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-lg font-semibold tracking-[-0.02em] text-ink">
              Scan a page
            </span>
            <span className="mt-0.5 block text-sm sm:text-base text-ink/55">
              Opens the camera · lay it flat, no flash
            </span>
          </span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="glass-hover group flex items-center gap-4 rounded-[15px] border border-line bg-white/45 p-5 text-left transition-all duration-[420ms] [transition-timing-function:var(--ease-glide)] hover:border-ink/25 hover:bg-white/75 disabled:opacity-55"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-line-strong bg-white/60 text-ink/70 transition-colors group-hover:border-ink/35 group-hover:text-ink">
            <Upload className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-lg font-semibold tracking-[-0.02em] text-ink">
              Upload a photo
            </span>
            <span className="mt-0.5 block text-sm sm:text-base text-ink/55">
              Choose an existing image from this device
            </span>
          </span>
        </button>
      </div>

      {/* Live scan status */}
      {stage !== "idle" && (
        <div
          className={cn(
            "reveal mt-3 rounded-[14px] border p-4",
            stage === "failed"
              ? "border-ink/40 bg-white/85"
              : "glass-strong border-line"
)}
        >
          {stage === "failed" ? (
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink" />
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium text-ink">We couldn't read this page clearly</p>
                <p className="mt-1 text-base leading-relaxed text-ink/60">
                  {failMessage ||
                    "The text was too blurred to trust, so nothing was added. Retake it in better light, or continue — the doctor can look at the paper with you."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="md" onClick={() => cameraInputRef.current?.click()}>
                    Retake the page
                  </Button>
                  <Button size="md" variant="tertiary" onClick={() => { setStage("idle"); setFailMessage(""); }}>
                    Continue without it
                  </Button>
                </div>
              </div>
            </div>
) : (
            <div className="flex items-start gap-3">
              {stage === "done" ? (
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3.5 8.5l3 3 6-6.5" />
                  </svg>
                </span>
) : (
                <Loader2 className="mt-0.5 h-4.5 w-4.5 shrink-0 animate-spin text-ink" />
)}
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium text-ink">
                  {stage === "done"
                    ? "Added — text read from the page"
                    : STAGE_LABEL[stage ]}
                </p>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-ink transition-[width] duration-[500ms] [transition-timing-function:var(--ease-glide)]"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-ink/60">
                  {stage === "done"
                    ? "The original photo is kept with this visit for the doctor."
                    : "Reading happens on this device. The photo is not uploaded to any server."}
                </p>
              </div>
            </div>
)}
        </div>
)}

      <div className="mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold tracking-[-0.015em] text-ink">
            Attached to this visit
          </h2>
          <span className="tabular text-sm text-ink/60">
            {docs.length} document{docs.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[0, 1].map(i => <Skeleton key={i} className="h-[76px] w-full rounded-[14px]" />)}
          </div>
) : docs.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No records added yet"
            description="Nothing is required to take a token. Reports only help the doctor avoid asking you the same things again."
            action={
              <Button size="md" onClick={() => cameraInputRef.current?.click()} icon={<Camera className="h-4 w-4" />}>
                Scan first page
              </Button>
            }
          />
) : (
          <ul className="space-y-2.5">
            {docs.map((doc, i) => {
              const Icon = typeIcon[doc.type] ?? FileText;
              return (
                <li key={doc.id} className="reveal" style={{ ["--i" ]: i }}>
                  <Card padding="sm" className="group border-line bg-white/50 hover:border-ink/20">
                    <div className="flex items-start gap-3.5 p-1">
                      {doc.imageDataUrl ? (
                        <img
                          src={doc.imageDataUrl}
                          alt=""
                          className="h-14 w-11 shrink-0 rounded-[7px] border border-line-strong object-cover"
                        />
) : (
                        <span className="flex h-14 w-11 shrink-0 items-center justify-center rounded-[7px] border border-line-strong bg-[#fbfbfa] text-ink/60">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-base font-medium text-ink">{doc.name}</p>
                          <Badge tone="solid" mark="dot" className="shrink-0">
                            {doc.status === "completed" ? "Read" : "Error"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-ink/60">
                          {doc.date} · {doc.type.replace("-", " ")}
                        </p>
                        {doc.extractedInfo && (
                          <p className="mt-2 rounded-[8px] border border-line bg-white/60 px-2.5 py-2 text-sm sm:text-base leading-relaxed text-ink/70">
                            {doc.extractedInfo}
                          </p>
)}
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-line/80 pt-2.5">
                      <Badge tone="quiet">From document</Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="tertiary" onClick={() => setPreview(doc)}>
                          View original
                        </Button>
                        <Button
                          size="sm"
                          variant="tertiary"
                          onClick={() => setConfirmRemove(doc)}
                          className="hover:bg-ink/[0.07]"
                          aria-label={`Remove ${doc.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
);
            })}
          </ul>
)}
      </div>

      {/* Real photo preview */}
      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ""}
        description={
          preview
            ? preview.imageDataUrl
              ? `${preview.date} · captured at the kiosk`
              : `${preview.date} · demo record (no photo attached)`
            : undefined
        }
      >
        {preview?.imageDataUrl ? (
          <div className="overflow-hidden rounded-[12px] border border-line bg-[#f7f7f5]">
            <img
              src={preview.imageDataUrl}
              alt={preview.name}
              className="max-h-[55vh] w-full object-contain"
            />
          </div>
) : (
          <div className="overflow-hidden rounded-[12px] border border-line bg-[#f7f7f5]">
            <div className="space-y-2.5 p-5">
              <div className="mb-4 h-[3px] w-24 rounded-full bg-ink/25" />
              {[92, 78, 88, 60, 84, 70, 88, 46].map((w, i) => (
                <div key={i} className="h-2.5 rounded-full bg-ink/12" style={{ width: `${w}%` }} />
))}
            </div>
          </div>
)}
        {preview?.extractedInfo && (
          <div className="mt-3 rounded-[10px] border border-line bg-white/60 p-3">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/60">
              Read from this page
            </p>
            <p className="mt-1.5 text-base leading-relaxed text-ink/80">{preview.extractedInfo}</p>
          </div>
)}
        <div className="mt-4 flex justify-end">
          <Button size="lg" onClick={() => setPreview(null)}>Close</Button>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(confirmRemove)}
        onClose={() => setConfirmRemove(null)}
        title="Remove this document?"
        description={
          confirmRemove
            ? `“${confirmRemove.name}” will no longer be attached to this visit. The doctor will not see it.`
            : undefined
        }
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="tertiary" size="lg" onClick={() => setConfirmRemove(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={() => confirmRemove && remove(confirmRemove)}
            data-autofocus
          >
            <Trash2 className="h-4 w-4" />
            Remove document
          </Button>
        </div>
      </Dialog>
    </KioskLayout>
);
}

/** UI document type -> the API enum. */
const TYPE_TO_API = {
  prescription: "PRESCRIPTION",
  "lab-report": "LAB_REPORT",
  "discharge-summary": "DISCHARGE_SUMMARY",
  imaging: "IMAGING",
  other: "OTHER",
};

/**
 * Shrink a captured page before it leaves the device. A phone photo is several
 * megabytes; the doctor only needs a legible reference next to the extracted
 * text, and small payloads keep the kiosk usable on a weak rural connection.
 */
async function downscaleDataUrl(dataUrl, maxWidth, quality) {
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode failed"));
      img.src = dataUrl;
    });

    const scale = Math.min(1, maxWidth / (img.naturalWidth || maxWidth));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round((img.naturalWidth || maxWidth) * scale);
    canvas.height = Math.round((img.naturalHeight || maxWidth) * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const out = canvas.toDataURL("image/jpeg", quality);
    // Stay inside the server's attachment ceiling; drop the thumbnail rather
    // than fail the whole scan.
    return out.length > 380_000 ? undefined : out;
  } catch {
    return undefined;
  }
}
