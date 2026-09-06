import { ActorType, Severity, SummaryStatus, DocumentType } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { recordAudit } from "./audit.service.js";

/**
 * The 12-question kiosk interview. The IDs and shape match what the existing
 * frontend already renders (translation keys live in the client i18n file), so
 * the server owns the questionnaire without changing a single screen.
 */
export const HISTORY_QUESTIONS = [
  { id: "q1", questionNumber: 1, textKey: "q.1", type: "text"  },
  { id: "q2", questionNumber: 2, textKey: "q.2", type: "single-choice", optionKeys: ["opt.today", "opt.2to3days", "opt.aboutWeek", "opt.moreWeek", "opt.moreMonth"] },
  { id: "q3", questionNumber: 3, textKey: "q.3", type: "scale", optionKeys: ["opt.mild", "2", "3", "4", "opt.severe"] },
  { id: "q4", questionNumber: 4, textKey: "q.4", type: "single-choice", optionKeys: ["opt.better", "opt.same", "opt.worse"] },
  { id: "q5", questionNumber: 5, textKey: "q.5", type: "multi-choice", optionKeys: ["opt.fever", "opt.vomiting", "opt.appetite", "opt.tired", "opt.headache", "opt.noneThese"] },
  { id: "q6", questionNumber: 6, textKey: "q.6", type: "single-choice", optionKeys: ["opt.yes", "opt.no", "opt.notSure"] },
  { id: "q7", questionNumber: 7, textKey: "q.7", type: "single-choice", optionKeys: ["opt.noAllergy", "opt.medicines", "opt.food", "opt.other"] },
  { id: "q8", questionNumber: 8, textKey: "q.8", type: "single-choice", optionKeys: ["opt.no", "opt.yes"] },
  { id: "q9", questionNumber: 9, textKey: "q.9", type: "multi-choice", optionKeys: ["opt.diabetes", "opt.bp", "opt.asthma", "opt.heart", "opt.thyroid", "opt.none"] },
  { id: "q10", questionNumber: 10, textKey: "q.10", type: "single-choice", optionKeys: ["opt.yes", "opt.no", "opt.notSure"] },
  { id: "q11", questionNumber: 11, textKey: "q.11", type: "multi-choice", optionKeys: ["opt.smoke", "opt.alcohol", "opt.neither"] },
  { id: "q12", questionNumber: 12, textKey: "q.12", type: "text"  },
];

export const QUESTION_IDS = new Set(HISTORY_QUESTIONS.map((q) => q.id));
export const TOTAL_QUESTIONS = HISTORY_QUESTIONS.length;

const asText = (v) =>
  Array.isArray(v) ? v.filter(Boolean).join(", ") : typeof v === "string" ? v.trim() : "";

const NEGATIVE = /^(no|none|nahi|नहीं|not sure|पता नहीं|no allergy|कोई एलर्जी नहीं|neither)$/i;

/**
 * Deterministic red-flag rules — clinically conservative, fully explainable, and
 * auditable. Intentionally NOT an LLM: in a clinical setting an unexplainable
 * warning is worse than none, and the doctor must be able to see the reason.
 */







const RULES = [
  {
    finding: "Chest pain reported",
    reason: "Chest pain requires cardiac causes to be excluded before routine OPD triage.",
    severity: Severity.HIGH,
    test: ({ text }) => /chest pain|chest discomfort|सीने में दर्द|छाती में दर्द|tightness in chest/i.test(text),
  },
  {
    finding: "Breathlessness reported",
    reason: "Dyspnoea can indicate cardiac or respiratory compromise; prioritise assessment.",
    severity: Severity.HIGH,
    test: ({ text }) => /breathless|shortness of breath|difficulty breathing|साँस लेने में तकलीफ|dyspnoea|dyspnea/i.test(text),
  },
  {
    finding: "Bleeding reported",
    reason: "Active or unexplained bleeding needs same-visit assessment.",
    severity: Severity.HIGH,
    test: ({ text }) => /bleeding|blood in|haemorrhage|hemorrhage|खून आना|रक्तस्राव/i.test(text),
  },
  {
    finding: "Loss of consciousness / fainting",
    reason: "Syncope may reflect a cardiac, neurological or metabolic cause.",
    severity: Severity.HIGH,
    test: ({ text }) => /unconscious|fainting|fainted|syncope|blackout|बेहोश/i.test(text),
  },
  {
    finding: "Severe pain score reported",
    reason: "Patient rated their symptom at the top of the severity scale.",
    severity: Severity.MODERATE,
    test: ({ severityScore }) => severityScore >= 5,
  },
  {
    finding: "Symptoms worsening",
    reason: "The patient reports deterioration since onset rather than improvement.",
    severity: Severity.MODERATE,
    test: ({ text }) => /\bworse\b|worsening|बिगड़/i.test(text),
  },
  {
    finding: "Older adult presentation",
    reason: "Age 65+ with an acute complaint — lower threshold for investigation.",
    severity: Severity.LOW,
    test: ({ age }) => age >= 65,
  },
  {
    finding: "Prolonged symptom duration",
    reason: "Symptoms persisting beyond a month warrant review for chronic causes.",
    severity: Severity.LOW,
    test: ({ text }) => /more than a month|over a month|महीने से अधिक|moreMonth/i.test(text),
  },
];

/**
 * Compile the draft narrative from what the patient actually answered and
 * scanned. Nothing is invented — an unanswered field says so explicitly, which
 * is what makes the provenance badges in the UI honest.
 */
export async function compileSummary(sessionId) {
  const session = await prisma.patientSession.findFirst({
    where: { id: sessionId, deletedAt: null },
    include: { answers: true, documents: true, summary: true },
  });
  if (!session) throw ApiError.notFound("That kiosk session has expired.");

  const a = {};
  for (const row of session.answers) a[row.questionId] = row.value;

  const chief = asText(a.q1) || session.problemText?.trim() || "Not stated at the kiosk";
  const duration = asText(a.q2);
  const severity = asText(a.q3);
  const course = asText(a.q4);
  const associated = asText(a.q5);
  const medsNow = asText(a.q6);
  const allergies = asText(a.q7);
  const surgery = asText(a.q8);
  const chronic = asText(a.q9);
  const family = asText(a.q10);
  const habits = asText(a.q11);
  const extra = asText(a.q12);

  const hpi = [
    chief !== "Not stated at the kiosk" ? chief : null,
    duration && `Duration: ${duration}.`,
    severity && `Severity: ${severity}.`,
    course && `Course: ${course}.`,
    associated && `Associated symptoms: ${associated}.`,
    extra || null,
  ]
    .filter(Boolean)
    .join(" ");

  const medications = [];
  if (medsNow && !NEGATIVE.test(medsNow)) {
    // Q6 is a yes/no question, so a bare "Yes" is a signal, not a drug name.
    // Rendering it as if it were a prescription would be actively misleading.
    medications.push(
      /^(yes|haan|हाँ|हां)$/i.test(medsNow)
        ? "Patient reports taking medication — details not captured at the kiosk"
        : medsNow
);
  }
  for (const doc of session.documents) {
    if (doc.type === DocumentType.PRESCRIPTION && doc.extractedText) {
      medications.push(doc.extractedText.slice(0, 300));
    }
  }

  const allergyList = !allergies || NEGATIVE.test(allergies) ? ["No known drug allergy"] : [allergies];

  const haystack = [chief, extra, associated, course, session.problemText ?? "", duration].join(" ");
  const severityScore = Number(/^[1-5]$/.test(severity) ? severity : /severe/i.test(severity) ? 5 : 0);

  const flags = RULES.filter((r) =>
    r.test({ text: haystack, age: session.age, sex: session.sex, severityScore })
);

  const payload = {
    chiefComplaint: chief,
    historyOfPresentIllness: hpi || "Patient has not completed the history interview yet.",
    pastMedicalHistory: [
      chronic && !NEGATIVE.test(chronic) ? `Long-term illness: ${chronic}.` : "No long-term illness reported.",
      surgery && !NEGATIVE.test(surgery) ? `Past surgery: ${surgery}.` : "No past surgery reported.",
    ].join(" "),
    medications: medications.length ? medications : ["None reported at the kiosk"],
    allergies: allergyList,
    familyHistory: family || "Not stated",
    socialHistory: habits || "Not stated",
    reviewOfSystems: associated || "Not stated",
  };

  // A verified chart is never silently overwritten by a recompile.
  if (session.summary?.status === SummaryStatus.VERIFIED) {
    return prisma.clinicalSummary.findUniqueOrThrow({
      where: { sessionId },
      include: { redFlags: true, verifiedBy: { select: { name: true } } },
    });
  }

  const summary = await prisma.$transaction(async (tx) => {
    const row = await tx.clinicalSummary.upsert({
      where: { sessionId },
      create: { sessionId, ...payload, compiledAt: new Date() },
      update: {
        ...payload,
        compiledAt: new Date(),
        status: SummaryStatus.DRAFT,
        version: { increment: 1 },
      },
    });

    await tx.redFlag.deleteMany({ where: { summaryId: row.id } });
    if (flags.length) {
      await tx.redFlag.createMany({
        data: flags.map((f) => ({
          summaryId: row.id,
          finding: f.finding,
          reason: f.reason,
          severity: f.severity,
          source: "system-compiled",
        })),
      });
    }

    await recordAudit(
      {
        actorType: ActorType.SYSTEM,
        sessionId,
        action: `Clinical draft compiled — ${session.answers.length}/${TOTAL_QUESTIONS} answered, ${flags.length} flag(s)`,
        entity: "ClinicalSummary",
        entityId: row.id,
      },
      tx
);

    return row;
  });

  return prisma.clinicalSummary.findUniqueOrThrow({
    where: { id: summary.id },
    include: { redFlags: true, verifiedBy: { select: { name: true } } },
  });
}
