import { ActorType, SummaryStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ok } from "../utils/respond.js";
import { recordAudit } from "../services/audit.service.js";
import { compileSummary } from "../services/summary.service.js";
import { getTokenPosition } from "../services/queue.service.js";
import {
  answerValue,
  serializeAudit,
  serializeDocument,
  serializeSummary,
  serializeToken,
} from "../utils/serialize.js";

/**
 * The doctor's read of one patient. Everything shown is traceable to something
 * the patient entered, a document they scanned, or a deterministic rule — which
 * is what the provenance badges in the UI are asserting.
 */
export async function getChart(req, res) {
  const tokenId = req.params.id;

  const token = await prisma.queueToken.findUnique({
    where: { id: tokenId },
    include: {
      doctor: { select: { id: true, name: true, room: true, department: { select: { name: true } } } },
      hospital: { select: { name: true } },
      session: {
        include: {
          answers: { orderBy: { questionId: "asc" } },
          documents: { orderBy: { createdAt: "desc" } },
          summary: { include: { redFlags: true, verifiedBy: { select: { name: true } } } },
          auditLogs: { orderBy: { createdAt: "asc" }, include: { staff: { select: { name: true, role: true } } } },
        },
      },
    },
  });
  if (!token) throw ApiError.notFound("That patient is not on today's board.");

  // A doctor may only open charts from their own queue.
  if (req.staff?.role === "DOCTOR" && req.staff.doctorId && token.doctorId !== req.staff.doctorId) {
    throw ApiError.forbidden("That patient is not in your queue.");
  }

  // Compile on first open so the doctor never sees an empty chart.
  const summary =
    token.session.summary ??
    (await compileSummary(token.sessionId).catch(() => null));

  const { nowServing, patientsAhead, etaAt } = await getTokenPosition(tokenId);

  const answers = {};
  for (const a of token.session.answers) answers[a.questionId] = answerValue(a.value);

  // The timeline is derived from what was actually scanned — no invented history.
  const timeline = token.session.documents.map((d) => ({
    id: `tl-${d.id}`,
    date: new Date(d.createdAt).toISOString().slice(0, 10),
    type:
      d.type === "PRESCRIPTION"
        ? "prescription"
        : d.type === "LAB_REPORT" || d.type === "IMAGING"
          ? "investigation"
          : "consultation",
    title: d.name,
    description: d.extractedText?.slice(0, 400) || "Scanned at the kiosk.",
    facility: token.hospital.name,
    source: "document",
  }));

  return ok(
    res,
    {
      token: serializeToken(
        { ...token, session: token.session },
        { nowServing: nowServing?.number ?? null, patientsAhead, etaAt }
),
      patient: {
        sessionId: token.sessionId,
        name: token.session.name,
        age: token.session.age,
        sex: token.session.sex,
        mobileLast4: token.session.mobileLast4,
        language: token.session.language,
      },
      summary: summary
        ? serializeSummary(
            summary
)
        : null,
      answers,
      documents: token.session.documents.map(serializeDocument),
      timeline,
      // Labs stay empty until structured extraction lands — no fabricated values.
      labs: [],
      audit: token.session.auditLogs.map(serializeAudit),
    },
    "Chart loaded."
);
}

/** Doctor edits the draft. Edits bump the version and mark it reviewed. */
export async function updateChartSummary(req, res) {
  const token = await prisma.queueToken.findUnique({
    where: { id: req.params.id },
    select: { sessionId: true, doctorId: true, number: true },
  });
  if (!token) throw ApiError.notFound("That patient is not on today's board.");
  if (req.staff?.role === "DOCTOR" && req.staff.doctorId && token.doctorId !== req.staff.doctorId) {
    throw ApiError.forbidden("That patient is not in your queue.");
  }

  const existing = await prisma.clinicalSummary.findUnique({ where: { sessionId: token.sessionId } });
  if (!existing) throw ApiError.notFound("No draft exists for this patient yet.");
  if (existing.status === SummaryStatus.VERIFIED) {
    throw ApiError.conflict("This chart is already signed and cannot be edited.");
  }

  const updated = await prisma.clinicalSummary.update({
    where: { sessionId: token.sessionId },
    data: { ...req.body, status: SummaryStatus.REVIEWED, version: { increment: 1 } },
    include: { redFlags: true, verifiedBy: { select: { name: true } } },
  });

  await recordAudit({
    actorType: ActorType.STAFF,
    staffId: req.staff.sub,
    sessionId: token.sessionId,
    action: `Draft edited (v${updated.version})`,
    entity: "ClinicalSummary",
    entityId: updated.id,
    meta: { fields: Object.keys(req.body) },
  });

  return ok(res, serializeSummary(updated), "Draft updated.");
}

/** Verify & sign — the clinician takes responsibility for the record. */
export async function verifyChart(req, res) {
  const token = await prisma.queueToken.findUnique({
    where: { id: req.params.id },
    select: { sessionId: true, doctorId: true, number: true },
  });
  if (!token) throw ApiError.notFound("That patient is not on today's board.");
  if (req.staff?.role === "DOCTOR" && req.staff.doctorId && token.doctorId !== req.staff.doctorId) {
    throw ApiError.forbidden("That patient is not in your queue.");
  }

  const existing = await prisma.clinicalSummary.findUnique({ where: { sessionId: token.sessionId } });
  if (!existing) throw ApiError.notFound("There is no draft to sign for this patient.");
  if (existing.status === SummaryStatus.VERIFIED) {
    throw ApiError.conflict("This chart has already been signed.");
  }

  const signed = await prisma.clinicalSummary.update({
    where: { sessionId: token.sessionId },
    data: {
      status: SummaryStatus.VERIFIED,
      verifiedById: req.staff.sub,
      verifiedAt: new Date(),
    },
    include: { redFlags: true, verifiedBy: { select: { name: true } } },
  });

  await recordAudit({
    actorType: ActorType.STAFF,
    staffId: req.staff.sub,
    sessionId: token.sessionId,
    action: `Chart verified and signed for token ${token.number}`,
    entity: "ClinicalSummary",
    entityId: signed.id,
  });

  return ok(res, serializeSummary(signed), "Chart verified and signed.");
}
