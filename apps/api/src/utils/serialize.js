import { TOTAL_QUESTIONS } from "../services/summary.service.js";

/**
 * Maps DB rows onto the exact shapes the existing frontend types already expect
 * (`src/types/index.ts`). Doing the translation here means not a single screen
 * had to change its props when the data started coming from Postgres.
 */

const TIME_FMT = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
};

/**
 * Times are rendered server-side in IST so every kiosk, phone and doctor screen
 * quotes the same clock regardless of the device timezone.
 * Node's en-IN locale emits lowercase "am/pm"; the UI uses uppercase throughout.
 */
export const fmtTime = (d) =>
  d
    ? new Date(d)
        .toLocaleTimeString("en-IN", TIME_FMT)
        .replace(/\u202f/g, " ")
        .replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase())
    : "—";

/** DB enum -> the lowercase union the UI renders. */
export const tokenStatusToUi = (s) =>
  ({
    WAITING: "waiting",
    ALMOST: "almost",
    CALLED: "called",
    IN_CONSULTATION: "in-consultation",
    COMPLETED: "completed",
    ABSENT: "completed",
  })[s] ?? "waiting";

export const docTypeToUi = (t) =>
  ({
    PRESCRIPTION: "prescription",
    LAB_REPORT: "lab-report",
    DISCHARGE_SUMMARY: "discharge-summary",
    IMAGING: "imaging",
    OTHER: "other",
  })[t] ?? "other";

export const summaryStatusToUi = (s) =>
  ({ DRAFT: "draft", REVIEWED: "reviewed", VERIFIED: "verified" })[s] ?? "draft";

/** BigInt (OSM ids) is not JSON-serialisable — normalise before responding. */
export const osmRef = (osmType, osmId) => `${osmType}${osmId.toString()}`;

export function serializeDoctor(d











) {
  const minToLabel = (m) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
  };

  const queueSize = d._count?.tokens ?? 0;
  const waitMins = Math.max(5, queueSize * d.slotMinutes);
  const nextSlot = new Date(Date.now() + waitMins * 60_000);

  return {
    id: d.id,
    name: d.name,
    qualification: d.qualification,
    specialty: d.specialty,
    department: d.department.name,
    room: d.room ?? undefined,
    opdTiming: `${minToLabel(d.opdStartMin)} – ${minToLabel(d.opdEndMin)}`,
    available: d.isAvailable,
    queueSize,
    estimatedWait: `${waitMins} min`,
    nextSlot: fmtTime(nextSlot),
    initials: initialsOf(d.name),
  };
}

export function initialsOf(name) {
  const parts = name.replace(/^dr\.?\s+/i, "").replace(/\./g, " ").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}







/** Shapes a token the way `Token` in the frontend types is declared. */
export function serializeToken(
  t,
  extra = {}
) {
  const eta = extra.etaAt ?? t.etaAt;
  return {
    id: t.id,
    number: t.number,
    patientName: t.session?.name ?? "Patient",
    age: t.session?.age ?? 0,
    sex: (t.session?.sex ?? "O"),
    doctorId: t.doctorId,
    doctorName: t.doctor?.name ?? "—",
    department: t.doctor?.department.name ?? "—",
    room: t.doctor?.room ?? undefined,
    hospitalName: t.hospital?.name ?? "—",
    generatedAt: fmtTime(t.issuedAt),
    estimatedTime: fmtTime(eta),
    recommendedArrival: eta ? fmtTime(new Date(new Date(eta).getTime() - 15 * 60_000)) : "—",
    currentServing: extra.nowServing ?? "—",
    patientsAhead: extra.patientsAhead ?? 0,
    status: tokenStatusToUi(t.status),
  };
}

/** Shapes a board row the way `QueueEntry` is declared. */
export function serializeQueueEntry(t













) {
  const answered = t.session._count.answers;
  const historyStatus =
    answered === 0 ? "pending" : answered < TOTAL_QUESTIONS ? "in-progress" : "ready";

  return {
    tokenId: t.id,
    tokenNumber: t.number,
    sessionId: t.session.id,
    patientName: t.session.name,
    age: t.session.age,
    sex: t.session.sex,
    chiefComplaint:
      t.session.summary?.chiefComplaint && t.session.summary.chiefComplaint !== "Not stated at the kiosk"
        ? t.session.summary.chiefComplaint
        : t.session.problemText || "—",
    historyStatus,
    answeredCount: answered,
    documentsCount: t.session._count.documents,
    attentionItems: t.session.summary?.redFlags.length ?? 0,
    estimatedTime: fmtTime(t.etaAt),
    status: tokenStatusToUi(t.status),
  };
}

export function serializeSummary(s















) {
  return {
    chiefComplaint: s.chiefComplaint,
    historyOfPresentIllness: s.historyOfPresentIllness,
    pastMedicalHistory: s.pastMedicalHistory,
    medications: s.medications,
    allergies: s.allergies,
    familyHistory: s.familyHistory,
    socialHistory: s.socialHistory,
    reviewOfSystems: s.reviewOfSystems,
    status: summaryStatusToUi(s.status),
    version: s.version,
    compiledAt: `Today, ${fmtTime(s.compiledAt)}`,
    verifiedBy: s.verifiedBy?.name,
    verifiedAt: s.verifiedAt ? fmtTime(s.verifiedAt) : undefined,
    redFlags: s.redFlags.map((f) => ({
      id: f.id,
      finding: f.finding,
      reason: f.reason,
      severity: f.severity.toLowerCase(),
      source: f.source,
      timestamp: fmtTime(f.createdAt),
    })),
  };
}

export function serializeDocument(d








) {
  return {
    id: d.id,
    name: d.name,
    type: docTypeToUi(d.type),
    date: new Date(d.createdAt).toISOString().slice(0, 10),
    status: d.status.toLowerCase(),
    extractedInfo: d.extractedText ?? undefined,
    ocrConfidence: d.ocrConfidence ?? undefined,
    imageDataUrl: d.thumbDataUrl ?? undefined,
    source: "document",
  };
}

export function serializeAudit(a





) {
  return {
    id: a.id,
    action: a.action,
    timestamp: fmtTime(a.createdAt),
    actor: a.staff?.name ?? (a.actorType === "PATIENT" ? "Patient" : "System"),
    role: (a.staff?.role ?? (a.actorType === "PATIENT" ? "patient" : "admin")).toLowerCase(),
  };
}

/** Prisma Json columns come back as unknown; answers are string | string[]. */
export const answerValue = (v) =>
  Array.isArray(v) ? v.map(String) : typeof v === "string" ? v : "";
