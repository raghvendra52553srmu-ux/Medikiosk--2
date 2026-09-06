import "dotenv/config";
import { PrismaClient, TokenStatus, SessionStatus } from "@prisma/client";
import { createHash } from "node:crypto";

/**
 * Optional demo data — a realistic morning OPD already in progress, so the
 * doctor and admin screens have something to show before anyone walks up to a
 * kiosk. Every row goes through the same tables and constraints as live
 * traffic; nothing here is a mock.
 *
 *   npm run demo         seed it
 *   npm run demo:reset   remove only these rows
 */

const prisma = new PrismaClient();

const TAG = "[demo]";

const PATIENTS = [
  { name: "Sunita Devi", age: 34, sex: "F", complaint: "Fever and body ache for three days", answers: { q1: "Fever and body ache for three days", q2: "opt.2to3days", q3: "3", q4: "opt.same", q5: ["opt.fever", "opt.tired"], q9: ["opt.none"] } },
  { name: "Ram Prakash Yadav", age: 62, sex: "M", complaint: "Chest pain and breathlessness on walking", answers: { q1: "Chest pain and breathlessness on walking", q2: "opt.aboutWeek", q3: "5", q4: "opt.worse", q5: ["opt.tired"], q9: ["opt.bp", "opt.diabetes"] } },
  { name: "Anjali Sharma", age: 28, sex: "F", complaint: "Severe headache since yesterday", answers: { q1: "Severe headache since yesterday", q2: "opt.today", q3: "4", q4: "opt.same", q5: ["opt.headache", "opt.vomiting"] } },
  { name: "Mohammed Irfan", age: 45, sex: "M", complaint: "Knee pain, difficulty climbing stairs", answers: { q1: "Knee pain, difficulty climbing stairs", q2: "opt.moreMonth", q3: "3", q4: "opt.worse", q9: ["opt.none"] } },
  { name: "Kamla Bai", age: 71, sex: "F", complaint: "Persistent cough for two weeks", answers: { q1: "Persistent cough for two weeks", q2: "opt.moreWeek", q3: "2", q4: "opt.same", q5: ["opt.tired", "opt.appetite"] } },
  { name: "Deepak Verma", age: 39, sex: "M", complaint: "Acidity and stomach discomfort after meals", answers: { q1: "Acidity and stomach discomfort after meals", q2: "opt.moreWeek", q3: "2", q4: "opt.better", q11: ["opt.smoke"] } },
  { name: "Priya Nair", age: 25, sex: "F", complaint: "Skin rash on both arms with itching", answers: { q1: "Skin rash on both arms with itching", q2: "opt.aboutWeek", q3: "3", q4: "opt.worse", q7: "opt.medicines" } },
  { name: "Harish Chandra", age: 55, sex: "M", complaint: "Follow-up for blood sugar control", answers: { q1: "Follow-up for blood sugar control", q2: "opt.moreMonth", q3: "1", q4: "opt.better", q6: "opt.yes", q9: ["opt.diabetes"] } },
];

/**
 * Where each patient is in the morning: two already seen, one in the room, the
 * rest waiting. The high-acuity chest-pain case is left waiting on purpose so
 * the triage flags are visible on the board rather than buried in history.
 */
const FLOW = [
  TokenStatus.COMPLETED,
  TokenStatus.WAITING,
  TokenStatus.IN_CONSULTATION,
  TokenStatus.WAITING,
  TokenStatus.WAITING,
  TokenStatus.COMPLETED,
  TokenStatus.WAITING,
  TokenStatus.WAITING,
];

const hashMobile = (m) => createHash("sha256").update(m).digest("hex");
const serviceDate = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

async function reset() {
  const { count } = await prisma.patientSession.deleteMany({
    where: { name: { in: PATIENTS.map(p => p.name) } },
  });
  console.log(`${TAG} removed ${count} demo session(s).`);
}

async function seed() {
  await reset();

  const doctor = await prisma.doctor.findFirst({
    where: { staff: { username: "doctor" } },
    include: { hospital: true },
  });

  if (!doctor) {
    console.error(`${TAG} No doctor is linked to the "doctor" account. Run "npm run seed" first.`);
    process.exit(1);
  }

  const today = serviceDate();
  const last = await prisma.queueToken.findFirst({
    where: { doctorId: doctor.id, serviceDate: today },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  let sequence = (last?.sequence ?? 100) + 1;

  const start = Date.now() - 95 * 60_000; // clinic opened ~1.5h ago

  for (const [i, p] of PATIENTS.entries()) {
    const status = FLOW[i];
    const issuedAt = new Date(start + i * 11 * 60_000);

    const session = await prisma.patientSession.create({
      data: {
        name: p.name,
        age: p.age,
        sex: p.sex,
        mobileHash: hashMobile(`98${String(10000000 + i)}`),
        mobileLast4: String(1000 + i * 7).slice(-4),
        language: i % 3 === 0 ? "hi" : "en",
        consentAt: issuedAt,
        problemText: p.complaint,
        status: status === TokenStatus.COMPLETED ? SessionStatus.CLOSED : SessionStatus.SUBMITTED,
        expiresAt: new Date(Date.now() + 12 * 3_600_000),
        createdAt: issuedAt,
      },
    });

    await prisma.historyAnswer.createMany({
      data: Object.entries(p.answers).map(([questionId, value]) => ({
        sessionId: session.id,
        questionId,
        value: value,
        answeredAt: issuedAt,
      })),
    });

    const number = `${doctor.tokenPrefix}-${sequence}`;
    await prisma.queueToken.create({
      data: {
        number,
        sequence,
        sessionId: session.id,
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId,
        serviceDate: today,
        status,
        issuedAt,
        etaAt: new Date(issuedAt.getTime() + 20 * 60_000),
        calledAt: status === TokenStatus.WAITING ? null : new Date(issuedAt.getTime() + 15 * 60_000),
        startedAt: status === TokenStatus.WAITING ? null : new Date(issuedAt.getTime() + 16 * 60_000),
        completedAt: status === TokenStatus.COMPLETED ? new Date(issuedAt.getTime() + 24 * 60_000) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: "PATIENT",
        sessionId: session.id,
        action: `Registered at kiosk — token ${number}`,
        entity: "PatientSession",
        entityId: session.id,
        createdAt: issuedAt,
      },
    });

    sequence++;
  }

  // Compile each draft through the real service so red flags are genuine.
  const { compileSummary } = await import("../src/services/summary.service.js");
  const sessions = await prisma.patientSession.findMany({
    where: { name: { in: PATIENTS.map(p => p.name) } },
    select: { id: true },
  });
  for (const s of sessions) await compileSummary(s.id);

  const flags = await prisma.redFlag.count();
  console.log(`${TAG} seeded ${PATIENTS.length} patients on ${doctor.name}'s board (${flags} red flags raised).`);
}

const run = process.argv.includes("--reset") ? reset : seed;

run()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
