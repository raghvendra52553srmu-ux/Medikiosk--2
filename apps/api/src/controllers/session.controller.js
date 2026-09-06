import { ActorType, SessionStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { created, ok } from "../utils/respond.js";
import { hashMobile } from "../utils/crypto.js";
import { recordAudit } from "../services/audit.service.js";
import { compileSummary, HISTORY_QUESTIONS, QUESTION_IDS, TOTAL_QUESTIONS } from "../services/summary.service.js";
import { answerValue, serializeDocument, serializeSummary, serializeToken } from "../utils/serialize.js";

/**
 * A kiosk session is the patient's identity for one visit. It is deliberately
 * NOT an account: a villager at a public terminal must never be asked to make a
 * password. The opaque id is the bearer of the visit.
 */

async function loadSession(id) {
  const session = await prisma.patientSession.findFirst({
    where: { id, deletedAt: null },
    include: {
      token: {
        include: {
          doctor: { select: { name: true, room: true, department: { select: { name: true } } } },
          hospital: { select: { name: true } },
          session: { select: { name: true, age: true, sex: true } },
        },
      },
      _count: { select: { answers: true, documents: true } },
    },
  });
  if (!session) throw ApiError.notFound("That kiosk session has expired. Please start again.");
  if (session.expiresAt < new Date()) {
    throw new ApiError(410, "SESSION_EXPIRED", "This kiosk session has ended for your privacy. Please start again.");
  }
  return session;
}

export async function createSession(req, res) {
  const { name, age, sex, mobile, language, kioskName } = req.body

;

  const kiosk = kioskName
    ? await prisma.kioskDevice.upsert({
        where: { name: kioskName },
        create: { name: kioskName },
        update: { lastSeenAt: new Date(), status: "ONLINE" },
      })
    : null;

  const session = await prisma.patientSession.create({
    data: {
      name,
      age,
      sex,
      // The raw number is never stored — only a hash plus the last 4 for desk matching.
      mobileHash: hashMobile(mobile),
      mobileLast4: mobile.slice(-4),
      language,
      consentAt: new Date(),
      kioskId: kiosk?.id ?? null,
      expiresAt: new Date(Date.now() + env.SESSION_TTL_HOURS * 3_600_000),
    },
  });

  await recordAudit({
    actorType: ActorType.PATIENT,
    sessionId: session.id,
    action: "Registered at kiosk",
    entity: "PatientSession",
    entityId: session.id,
    meta: { kiosk: kiosk?.name ?? "unknown", language },
  });

  return created(
    res,
    { sessionId: session.id, name: session.name, age: session.age, sex: session.sex, expiresAt: session.expiresAt },
    "Registration saved."
);
}

export async function getSession(req, res) {
  const session = await loadSession(req.params.id);
  return ok(
    res,
    {
      id: session.id,
      name: session.name,
      age: session.age,
      sex: session.sex,
      mobileLast4: session.mobileLast4,
      language: session.language,
      problemText: session.problemText,
      problemPresetId: session.problemPresetId,
      status: session.status,
      answeredCount: session._count.answers,
      documentsCount: session._count.documents,
      totalQuestions: TOTAL_QUESTIONS,
      token: session.token ? serializeToken(session.token) : null,
      expiresAt: session.expiresAt,
    },
    "Session loaded."
);
}

export async function updateSession(req, res) {
  await loadSession(req.params.id);
  const session = await prisma.patientSession.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return ok(res, { id: session.id, problemText: session.problemText }, "Saved.");
}

/* ── History interview ────────────────────────────────────── */

export async function listQuestions(_req, res) {
  return ok(
    res,
    HISTORY_QUESTIONS.map((q) => ({ ...q, totalQuestions: TOTAL_QUESTIONS })),
    "Questions loaded."
);
}

export async function getAnswers(req, res) {
  await loadSession(req.params.id);
  const rows = await prisma.historyAnswer.findMany({ where: { sessionId: req.params.id } });
  const answers = {};
  for (const r of rows) answers[r.questionId] = answerValue(r.value);
  return ok(res, { answers, answeredCount: rows.length, totalQuestions: TOTAL_QUESTIONS }, "Answers loaded.");
}

/** Upsert one answer — the interview is resumable if the patient walks away. */
export async function saveAnswer(req, res) {
  const { id, questionId } = req.params;
  if (!QUESTION_IDS.has(questionId)) throw ApiError.badRequest("Unknown question.");
  await loadSession(id);

  const { value } = req.body;

  await prisma.$transaction([
    prisma.historyAnswer.upsert({
      where: { sessionId_questionId: { sessionId: id, questionId } },
      create: { sessionId: id, questionId, value },
      update: { value, answeredAt: new Date() },
    }),
    prisma.patientSession.update({
      where: { id },
      data: { status: SessionStatus.HISTORY },
    }),
  ]);

  const answeredCount = await prisma.historyAnswer.count({ where: { sessionId: id } });
  return ok(res, { questionId, answeredCount, totalQuestions: TOTAL_QUESTIONS }, "Answer saved.");
}

/* ── Documents ────────────────────────────────────────────── */

export async function listDocuments(req, res) {
  await loadSession(req.params.id);
  const docs = await prisma.document.findMany({
    where: { sessionId: req.params.id },
    orderBy: { createdAt: "desc" },
  });
  return ok(res, docs.map(serializeDocument), "Documents loaded.");
}

/**
 * OCR runs in the browser, so only the extracted text (and optionally a small
 * thumbnail) arrives here — the patient's original scan never leaves the kiosk.
 */
export async function addDocument(req, res) {
  await loadSession(req.params.id);
  const doc = await prisma.document.create({
    data: { sessionId: req.params.id, ...req.body },
  });

  await recordAudit({
    actorType: ActorType.PATIENT,
    sessionId: req.params.id,
    action: `Document scanned — ${doc.name}`,
    entity: "Document",
    entityId: doc.id,
  });

  return created(res, serializeDocument(doc), "Document attached.");
}

export async function deleteDocument(req, res) {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) throw ApiError.notFound("That document is no longer attached.");
  await prisma.document.delete({ where: { id: req.params.id } });
  await recordAudit({
    actorType: ActorType.PATIENT,
    sessionId: doc.sessionId,
    action: `Document removed — ${doc.name}`,
    entity: "Document",
    entityId: doc.id,
  });
  return ok(res, null, "Document removed.");
}

/* ── Summary + submit ─────────────────────────────────────── */

export async function getSummary(req, res) {
  await loadSession(req.params.id);
  const summary = await compileSummary(req.params.id);
  return ok(res, serializeSummary(summary), "Summary compiled.");
}

/** Final kiosk step: recompile, mark submitted, and push it onto the board. */
export async function submitSession(req, res) {
  const session = await loadSession(req.params.id);
  if (!session.token) throw ApiError.badRequest("Take a token before sending your details to the doctor.");

  await compileSummary(req.params.id);
  await prisma.patientSession.update({
    where: { id: req.params.id },
    data: { status: SessionStatus.SUBMITTED },
  });

  await recordAudit({
    actorType: ActorType.PATIENT,
    sessionId: req.params.id,
    action: "History submitted to doctor",
    entity: "PatientSession",
    entityId: req.params.id,
  });

  const { emitQueueChanged } = await import("../realtime/queueEvents.js");
  emitQueueChanged(session.token.doctorId, { tokenId: session.token.id, reason: "submitted" });

  return ok(res, { tokenId: session.token.id, tokenNumber: session.token.number }, "Sent to the doctor for review.");
}
