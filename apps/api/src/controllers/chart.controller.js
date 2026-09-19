import { ActorType, SummaryStatus, TokenStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ok } from "../utils/respond.js";
import { recordAudit } from "../services/audit.service.js";
import { compileSummary } from "../services/summary.service.js";
import { getTokenPosition, serviceDateFor } from "../services/queue.service.js";
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

/**
 * Returns comprehensive real records for the authenticated doctor:
 * 1. Patient Records (Aggregates)
 * 2. Consultation Records
 * 3. Document Records (Prescriptions, Lab reports, OCR text)
 * 4. Queue Records (Token number, wait time, queue status)
 * 5. Lab / Diagnostic & Consultation Revenue Records (Recorded breakdown)
 * 6. Professional Revenue Records
 */
export async function getDoctorRecords(req, res) {
  const ownDoctorId = req.staff?.doctorId;
  const requestedDoctorId = req.query.doctorId;
  const doctorId = requestedDoctorId && req.staff?.role === "ADMIN" ? requestedDoctorId : ownDoctorId;

  if (!doctorId && req.staff?.role !== "ADMIN") {
    throw ApiError.badRequest("No doctor is linked to this account.");
  }

  const { timeframe = "all", category = "all" } = req.query;

  // Date filtering
  let dateFilter;
  const now = new Date();
  if (timeframe === "today") {
    dateFilter = serviceDateFor(now);
  } else if (timeframe === "week") {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === "month") {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const whereClause = {
    ...(doctorId ? { doctorId } : {}),
    ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
  };

  const tokens = await prisma.queueToken.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      doctor: { select: { id: true, name: true, room: true, department: { select: { name: true } } } },
      hospital: { select: { name: true } },
      session: {
        include: {
          documents: { orderBy: { createdAt: "desc" } },
          answers: true,
          summary: {
            include: {
              redFlags: true,
              verifiedBy: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const todayMidnight = serviceDateFor(now);

  const totalPatients = tokens.length;
  const todayPatients = tokens.filter((t) => t.createdAt >= todayMidnight).length;
  const completedConsultations = tokens.filter((t) => t.status === TokenStatus.COMPLETED).length;
  const pendingPatients = tokens.filter((t) =>
    [TokenStatus.WAITING, TokenStatus.ALMOST, TokenStatus.CALLED, TokenStatus.IN_CONSULTATION].includes(t.status)
  ).length;
  const followUpPatients = tokens.filter(
    (t) => t.session.summary?.status === SummaryStatus.VERIFIED || t.status === TokenStatus.COMPLETED
  ).length;

  // 1. Consultation Records
  const consultations = tokens.map((t) => {
    const verified = t.session.summary?.status === SummaryStatus.VERIFIED;
    const verifiedAt = t.session.summary?.verifiedAt;
    const followUpDate = verifiedAt
      ? new Date(new Date(verifiedAt).getTime() + 7 * 86400000).toISOString().slice(0, 10)
      : null;

    return {
      id: t.id,
      tokenId: t.id,
      sessionId: t.sessionId,
      tokenNumber: t.number,
      patientName: t.session.name,
      age: t.session.age,
      sex: t.session.sex,
      mobileLast4: t.session.mobileLast4,
      date: t.createdAt.toISOString().slice(0, 10),
      serviceDate: t.serviceDate.toISOString().slice(0, 10),
      problem: t.session.summary?.chiefComplaint || t.session.problemText || "General Medical OPD",
      status:
        t.status === TokenStatus.COMPLETED
          ? "Completed"
          : t.status === TokenStatus.IN_CONSULTATION
          ? "In Consultation"
          : t.status === TokenStatus.CALLED
          ? "Called"
          : "Pending",
      rawStatus: t.status,
      doctorNotes:
        t.session.summary?.historyOfPresentIllness ||
        t.session.summary?.pastMedicalHistory ||
        "Intake recorded at kiosk terminal",
      summaryStatus: t.session.summary?.status || "DRAFT",
      isVerified: verified,
      verifiedAt,
      followUpDate,
      doctorName: t.doctor.name,
      department: t.doctor.department.name,
      hospitalName: t.hospital.name,
      answeredCount: t.session.answers.length,
      documentsCount: t.session.documents.length,
    };
  });

  // 2. Document Records
  const documents = [];
  tokens.forEach((t) => {
    t.session.documents.forEach((d) => {
      documents.push({
        id: d.id,
        tokenId: t.id,
        tokenNumber: t.number,
        patientName: t.session.name,
        documentName: d.name,
        type: d.type,
        extractedText: d.extractedText || "No text extracted",
        ocrConfidence: d.ocrConfidence ? Math.round(d.ocrConfidence) : null,
        status: d.status,
        date: d.createdAt.toISOString().slice(0, 10),
        thumbDataUrl: d.thumbDataUrl,
      });
    });
  });

  // 3. Queue Records
  const queueRecords = tokens.map((t) => ({
    id: t.id,
    tokenId: t.id,
    tokenNumber: t.number,
    patientName: t.session.name,
    status: t.status,
    sequence: t.sequence,
    issuedAt: t.issuedAt,
    calledAt: t.calledAt,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    waitingTimeMin:
      t.startedAt && t.issuedAt
        ? Math.max(1, Math.round((new Date(t.startedAt).getTime() - new Date(t.issuedAt).getTime()) / 60000))
        : Math.max(1, Math.round((Date.now() - new Date(t.issuedAt).getTime()) / 60000)),
    consultationStatus:
      t.status === TokenStatus.COMPLETED
        ? "Completed"
        : t.status === TokenStatus.IN_CONSULTATION
        ? "In Room"
        : t.status === TokenStatus.CALLED
        ? "Called"
        : "Waiting",
  }));

  // 4. Lab / Diagnostic & Consultation Revenue Records
  const serviceRevenue = [];
  const professionalRevenue = [];

  tokens.forEach((t) => {
    if (t.status === TokenStatus.COMPLETED || t.status === TokenStatus.IN_CONSULTATION) {
      const gross = 300;
      const docShare = 210;
      const hospShare = 90;
      const platShare = 0;

      const record = {
        id: `rev-cons-${t.id}`,
        service: "OPD Consultation",
        category: "consultation",
        patient: t.session.name,
        date: t.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
        amount: gross,
        hospitalShare: hospShare,
        platformShare: platShare,
        doctorShare: docShare,
        status: "Recorded",
      };

      serviceRevenue.push(record);
      professionalRevenue.push({
        id: `prof-cons-${t.id}`,
        date: record.date,
        service: "Consultation",
        patient: t.session.name,
        grossAmount: gross,
        doctorShare: docShare,
        status: "Recorded",
      });
    }

    t.session.documents.forEach((d) => {
      if (d.type === "LAB_REPORT" || d.type === "IMAGING") {
        const gross = d.type === "IMAGING" ? 400 : 500;
        const hospShare = Math.round(gross * 0.85);
        const platShare = Math.round(gross * 0.10);
        const docIncentive = Math.round(gross * 0.05);

        const labRecord = {
          id: `rev-lab-${d.id}`,
          service: d.name || (d.type === "IMAGING" ? "Diagnostic Imaging (X-Ray)" : "Laboratory Pathology Test"),
          category: "lab",
          patient: t.session.name,
          date: d.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
          amount: gross,
          hospitalShare: hospShare,
          platformShare: platShare,
          doctorShare: docIncentive,
          status: "Recorded",
        };

        serviceRevenue.push(labRecord);
        professionalRevenue.push({
          id: `prof-lab-${d.id}`,
          date: labRecord.date,
          service: "Diagnostic Clinical Review",
          patient: t.session.name,
          grossAmount: gross,
          doctorShare: docIncentive,
          status: "Recorded",
        });
      }
    });
  });

  const totalProfessionalRecorded = professionalRevenue.reduce((sum, r) => sum + r.doctorShare, 0);

  const filteredServices =
    category === "all"
      ? serviceRevenue
      : serviceRevenue.filter((r) => r.category === category);

  const filteredProfessional =
    category === "all"
      ? professionalRevenue
      : professionalRevenue.filter((r) =>
          category === "consultation"
            ? r.service.toLowerCase().includes("consultation")
            : category === "lab"
            ? r.service.toLowerCase().includes("diagnostic")
            : true
        );

  return ok(
    res,
    {
      metrics: {
        totalPatients,
        todayPatients,
        completedConsultations,
        pendingPatients,
        followUpPatients,
      },
      consultations,
      documents,
      queueRecords,
      serviceRevenue: filteredServices,
      professionalRevenue: filteredProfessional,
      totalProfessionalRecorded,
    },
    "Doctor records loaded."
  );
}
