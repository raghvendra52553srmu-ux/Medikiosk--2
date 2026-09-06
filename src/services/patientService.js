import { api } from "@/services/apiClient";
import { syncHospital } from "@/services/hospitalService";

/**
 * Patient-visit data, backed by the API.
 *
 * The kiosk keeps exactly ONE thing on the device: the opaque session id of the
 * visit in progress (plus the token id, so a refresh lands back on the right
 * screen). Every clinical fact — answers, documents, summary, queue position —
 * lives in Postgres, which is what lets the doctor on another machine see this
 * patient at all.
 *
 * Function names and shapes are unchanged from the original localStorage
 * implementation, so no page needed rewriting to gain real persistence.
 */

// NOTE: distinct from AppContext's `medikiosk.session.v1` (role/language prefs).
const SESSION_KEY = "medikiosk.visit.v1";
















const EMPTY = {
  sessionId: "",
  patient: { name: "", age: 0, sex: "F" },
};

export function readClinic() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw)) };
  } catch {
    return EMPTY;
  }
}

export function saveClinic(patch) {
  const next = { ...readClinic(), ...patch };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — the server copy still governs this visit */
  }
  return next;
}

export function clearClinic() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  return EMPTY;
}

export const hasActiveSession = () => Boolean(readClinic().sessionId);

/** Throws a friendly error rather than firing a request with an empty id. */
function requireSessionId() {
  const { sessionId } = readClinic();
  if (!sessionId) {
    throw new Error("Your kiosk session has ended. Please start again from the home screen.");
  }
  return sessionId;
}

/* ── Registration ─────────────────────────────────────────── */









export async function registerPatient(input) {
  const data = await api.post("/sessions", {
    ...input,
    language: input.language ?? "en",
    consent: true,
    kioskName: kioskName(),
  });

  saveClinic({
    sessionId: data.sessionId,
    patient: { name: data.name, age: data.age, sex: data.sex },
  });

  // The complaint is captured in the triage step, before a session exists.
  // Attach it now so the doctor's board and the compiled summary both have it.
  const { problemText, problemPresetId } = readClinic();
  if (problemText) {
    await saveProblem(problemText, problemPresetId).catch(() => {
      /* non-fatal: the patient can still restate it in the interview */
    });
  }

  return data;
}

/** Stable per-device label so the admin fleet view means something. */
function kioskName() {
  const KEY = "medikiosk.device.v1";
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const name = `Kiosk ${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(KEY, name);
    return name;
  } catch {
    return "Kiosk (unregistered)";
  }
}

export async function saveProblem(problemText, problemPresetId) {
  const sessionId = requireSessionId();
  await api.patch(`/sessions/${sessionId}`, { problemText, problemPresetId });
  saveClinic({ problemText, problemPresetId });
}

/* ── Token ────────────────────────────────────────────────── */

/**
 * Issue the OPD token. The facility is upserted from the OSM record the kiosk
 * already holds, so the doctor's board knows which building the patient is in.
 */
export async function issueToken(hospital, doctor) {
  const sessionId = requireSessionId();
  await syncHospital(hospital);

  const token = await api.post("/tokens", { sessionId, doctorId: doctor.id });

  saveClinic({
    tokenId: token.id,
    tokenNumber: token.number,
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    doctorId: doctor.id,
    doctorName: doctor.name,
    department: doctor.department,
  });

  return token;
}

/** Live token + queue position. Safe to poll. */
export async function getToken(tokenId) {
  const id = tokenId && tokenId !== "t1" ? tokenId : readClinic().tokenId;
  if (!id) throw new Error("No token has been taken on this kiosk yet.");
  return api.get(`/tokens/${id}`);
}

/* ── History interview ────────────────────────────────────── */










export async function getHistoryQuestions() {
  return api.get("/sessions/questions");
}

export async function getAnswers() {
  const sessionId = requireSessionId();
  const data = await api.get(`/sessions/${sessionId}/answers`);
  return data.answers;
}

/** One call per answer — the interview survives a walk-away or a refresh. */
export async function saveAnswer(questionId, value) {
  const sessionId = requireSessionId();
  return api.put(
    `/sessions/${sessionId}/answers/${questionId}`,
    { value }
);
}

/* ── Documents ────────────────────────────────────────────── */

export async function getDocuments() {
  const { sessionId } = readClinic();
  if (!sessionId) return [];
  return api.get(`/sessions/${sessionId}/documents`);
}









export async function addDocument(doc) {
  const sessionId = requireSessionId();
  return api.post(`/sessions/${sessionId}/documents`, doc);
}

export async function deleteDocument(documentId) {
  return api.delete(`/documents/${documentId}`);
}

/* ── Summary / submit ─────────────────────────────────────── */

export async function getClinicalSummary() {
  const sessionId = requireSessionId();
  return api.get(`/sessions/${sessionId}/summary`);
}

export async function submitToDoctor() {
  const sessionId = requireSessionId();
  return api.post(`/sessions/${sessionId}/submit`);
}

/* ── Views the doctor chart also renders ──────────────────── */

/**
 * The patient-side timeline is derived from documents they scanned this visit.
 * Nothing is invented: with no scans, the UI shows its empty state.
 */
export async function getTimeline() {
  const docs = await getDocuments();
  return docs.map((d) => ({
    id: `tl-${d.id}`,
    date: d.date,
    type:
      d.type === "prescription"
        ? ("prescription")
        : d.type === "lab-report" || d.type === "imaging"
          ? ("investigation")
          : ("consultation"),
    title: d.name,
    description: d.extractedInfo || "Scanned at the kiosk.",
    facility: readClinic().hospitalName,
    source: "document",
  }));
}

/** Structured lab extraction is not implemented — so this stays empty by design. */
export async function getLabResults() {
  return [];
}

export async function getAuditTrail() {
  const { sessionId, tokenId } = readClinic();
  if (!sessionId || !tokenId) return [];
  // The patient-facing trail is the subset the chart endpoint already returns.
  try {
    const chart = await api.get(`/charts/${tokenId}`);
    return chart.audit;
  } catch {
    // Unauthenticated on the kiosk — the trail is a clinician-facing view.
    return [];
  }
}
