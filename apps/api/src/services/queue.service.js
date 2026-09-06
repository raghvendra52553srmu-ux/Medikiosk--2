import { Prisma, TokenStatus, SessionStatus, ActorType } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { recordAudit } from "./audit.service.js";
import { emitQueueChanged } from "../realtime/queueEvents.js";
import { TOTAL_QUESTIONS } from "./summary.service.js";

/** Date-only bucket (UTC midnight) so token sequences reset each day. */
export function serviceDateFor(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Statuses that still occupy a place in the line. */
const ACTIVE = [
  TokenStatus.WAITING,
  TokenStatus.ALMOST,
  TokenStatus.CALLED,
  TokenStatus.IN_CONSULTATION,
];

/**
 * Allocate the next token for a doctor, atomically.
 *
 * The prototype used a hardcoded "A-127", so every patient got the same number.
 * Here the sequence is derived inside a serialisable transaction and the
 * database's unique (doctorId, serviceDate, sequence) index is the final
 * arbiter — two kiosks submitting at the same instant cannot collide.
 */
export async function issueToken(params) {
  return withSerializableRetry(() => issueTokenOnce(params));
}

/**
 * Serializable transactions are the correct tool here, but Postgres answers a
 * genuine race with a 40001 serialization failure (or a 23505 on our unique
 * index). Both mean "someone beat you to that sequence number" — the caller
 * should simply try again, not see an error. Retrying with jitter keeps the
 * invariant AND keeps every patient served.
 */
const RETRYABLE = new Set(["P2034", "P2002"]);

async function withSerializableRetry(fn, attempts = 6) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const code =
        err instanceof Prisma.PrismaClientKnownRequestError ? err.code : undefined;
      const pgCode =
        typeof err === "object" && err !== null && "code" in err ? String((err).code) : undefined;

      if (!code || !RETRYABLE.has(code)) {
        if (pgCode !== "40001") throw err;
      }
      lastError = err;
      // Exponential backoff with jitter so retries de-synchronise.
      await new Promise((r) => setTimeout(r, 15 * 2 ** i + Math.random() * 25));
    }
  }
  throw lastError;
}

async function issueTokenOnce(params) {
  const { sessionId, doctorId } = params;

  return prisma.$transaction(
    async (tx) => {
      const session = await tx.patientSession.findFirst({
        where: { id: sessionId, deletedAt: null },
        include: { token: true },
      });
      if (!session) throw ApiError.notFound("That kiosk session has expired. Please register again.");
      if (session.token) return { token: session.token, reused: true };
      if (!session.consentAt) throw ApiError.badRequest("Consent is required before a token can be issued.");

      const doctor = await tx.doctor.findUnique({
        where: { id: doctorId },
        include: { hospital: { select: { id: true } } },
      });
      if (!doctor) throw ApiError.notFound("That doctor is no longer listed at this facility.");
      if (!doctor.isAvailable) throw ApiError.conflict("That doctor's OPD is closed for today.");

      const serviceDate = serviceDateFor();

      const last = await tx.queueToken.findFirst({
        where: { doctorId, serviceDate },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });
      const sequence = (last?.sequence ?? 100) + 1;
      const number = `${doctor.tokenPrefix}-${sequence}`;

      // How many people are genuinely ahead right now.
      const ahead = await tx.queueToken.count({
        where: { doctorId, serviceDate, status: { in: ACTIVE } },
      });

      const etaAt = new Date(Date.now() + (ahead * doctor.slotMinutes + 8) * 60_000);

      const token = await tx.queueToken.create({
        data: {
          number,
          sequence,
          sessionId,
          doctorId,
          hospitalId: doctor.hospital.id,
          serviceDate,
          etaAt,
          status: TokenStatus.WAITING,
        },
      });

      await tx.patientSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.TOKEN_ISSUED },
      });

      await recordAudit(
        {
          actorType: ActorType.PATIENT,
          sessionId,
          action: `Token ${number} issued`,
          entity: "QueueToken",
          entityId: token.id,
          meta: { doctorId, ahead },
        },
        tx
);

      return { token, reused: false };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 }
);
}

/** Live position for the patient's own queue screen. */
export async function getTokenPosition(tokenId) {
  const token = await prisma.queueToken.findUnique({
    where: { id: tokenId },
    include: {
      doctor: { select: { id: true, name: true, slotMinutes: true, room: true, department: { select: { name: true } } } },
      hospital: { select: { name: true } },
      session: { select: { name: true, age: true, sex: true } },
    },
  });
  if (!token) throw ApiError.notFound("We could not find that token.");

  const nowServing = await prisma.queueToken.findFirst({
    where: {
      doctorId: token.doctorId,
      serviceDate: token.serviceDate,
      status: { in: [TokenStatus.IN_CONSULTATION, TokenStatus.CALLED] },
    },
    orderBy: [{ status: "asc" }, { sequence: "asc" }],
    select: { number: true, sequence: true },
  });

  /**
   * Once this patient has been called or is in the room, nobody is ahead of
   * them — otherwise the screen says "being called" and "6 patients ahead" at
   * the same time, which is exactly the kind of contradiction that sends
   * someone back to the desk to ask.
   */
  const isUp =
    token.status === TokenStatus.CALLED ||
    token.status === TokenStatus.IN_CONSULTATION ||
    token.status === TokenStatus.COMPLETED;

  const patientsAhead = isUp
    ? 0
    : await prisma.queueToken.count({
        where: {
          doctorId: token.doctorId,
          serviceDate: token.serviceDate,
          status: { in: ACTIVE },
          sequence: { lt: token.sequence },
        },
      });

  const etaAt =
    token.status === TokenStatus.COMPLETED
      ? token.completedAt
      : new Date(Date.now() + (patientsAhead * token.doctor.slotMinutes + 5) * 60_000);

  return { token, nowServing, patientsAhead, etaAt };
}

/** The doctor's board, ordered the way the room actually runs. */
export async function getDoctorQueue(doctorId, date = serviceDateFor()) {
  return prisma.queueToken.findMany({
    where: { doctorId, serviceDate: date, status: { in: ACTIVE } },
    orderBy: [{ sequence: "asc" }],
    include: {
      session: {
        select: {
          id: true,
          name: true,
          age: true,
          sex: true,
          problemText: true,
          status: true,
          summary: { select: { chiefComplaint: true, status: true, redFlags: { select: { id: true, severity: true } } } },
          _count: { select: { documents: true, answers: true } },
        },
      },
    },
  });
}

export async function getQueueMetrics(doctorId, date = serviceDateFor()) {
  const [active, completedToday, absentToday, doctor] = await Promise.all([
    getDoctorQueue(doctorId, date),
    prisma.queueToken.count({ where: { doctorId, serviceDate: date, status: TokenStatus.COMPLETED } }),
    prisma.queueToken.count({ where: { doctorId, serviceDate: date, status: TokenStatus.ABSENT } }),
    prisma.doctor.findUnique({ where: { id: doctorId }, select: { slotMinutes: true, opdStartMin: true, opdEndMin: true } }),
  ]);

  // "Ready" must mean the same thing here as on the queue board (serializeQueueEntry):
  // the patient finished the whole interview. Two different definitions of the
  // same word across two screens is worse than a slightly lower number.
  const historyReady = active.filter((t) => t.session._count.answers >= TOTAL_QUESTIONS).length;
  const flaggedRows = active.filter((t) => (t.session.summary?.redFlags.length ?? 0) > 0);
  const awaitingSignOff = active.filter((t) => t.session.summary?.status === "DRAFT" || t.session.summary?.status === "REVIEWED").length;

  const slot = doctor?.slotMinutes ?? 5;
  const waiting = active.filter((t) => t.status === TokenStatus.WAITING || t.status === TokenStatus.ALMOST);
  const medianWaitMin = waiting.length === 0 ? 0 : Math.round(((waiting.length + 1) / 2) * slot);

  const slotCapacity =
    doctor && doctor.opdEndMin > doctor.opdStartMin
      ? Math.floor((doctor.opdEndMin - doctor.opdStartMin) / slot)
      : 0;

  const next =
    active.find((t) => t.status === TokenStatus.IN_CONSULTATION || t.status === TokenStatus.CALLED) ??
    active.find((t) => t.status === TokenStatus.WAITING) ??
    null;

  return {
    inQueue: active.length,
    historyReady,
    awaitingSignOff,
    flagged: flaggedRows.length,
    completedToday,
    absentToday,
    medianWaitMin,
    slotCapacity,
    next,
    flaggedRows,
    active,
  };
}

const TRANSITIONS = {
  call: [TokenStatus.WAITING, TokenStatus.ALMOST, TokenStatus.CALLED],
  start: [TokenStatus.CALLED, TokenStatus.WAITING, TokenStatus.ALMOST],
  complete: [TokenStatus.IN_CONSULTATION, TokenStatus.CALLED],
  absent: [TokenStatus.WAITING, TokenStatus.ALMOST, TokenStatus.CALLED],
};

/**
 * Queue state machine. Illegal jumps are rejected rather than silently applied,
 * so the board cannot drift into a state the room never reached.
 */
export async function transitionToken(
  tokenId,
  action,
  staffId
) {
  const result = await prisma.$transaction(async (tx) => {
    const token = await tx.queueToken.findUnique({ where: { id: tokenId } });
    if (!token) throw ApiError.notFound("That token is not on today's board.");

    const allowed = TRANSITIONS[action];
    if (!allowed.includes(token.status)) {
      throw ApiError.conflict(
        `Cannot ${action} a token that is already ${token.status.toLowerCase().replace(/_/g, " ")}.`
);
    }

    const now = new Date();
    let data;

    switch (action) {
      case "call":
        // Only one patient may be called at a time for a given doctor.
        await tx.queueToken.updateMany({
          where: {
            doctorId: token.doctorId,
            serviceDate: token.serviceDate,
            status: TokenStatus.CALLED,
            id: { not: tokenId },
          },
          data: { status: TokenStatus.WAITING },
        });
        data = { status: TokenStatus.CALLED, calledAt: now };
        break;
      case "start":
        data = { status: TokenStatus.IN_CONSULTATION, startedAt: now, calledAt: token.calledAt ?? now };
        break;
      case "complete":
        data = { status: TokenStatus.COMPLETED, completedAt: now };
        break;
      case "absent":
        data = { status: TokenStatus.ABSENT, completedAt: now };
        break;
    }

    const updated = await tx.queueToken.update({ where: { id: tokenId }, data });

    if (action === "complete") {
      await tx.patientSession.update({
        where: { id: token.sessionId },
        data: { status: SessionStatus.CLOSED },
      });
    }

    await recordAudit(
      {
        actorType: ActorType.STAFF,
        staffId,
        sessionId: token.sessionId,
        action: `Token ${token.number} — ${action}`,
        entity: "QueueToken",
        entityId: tokenId,
      },
      tx
);

    return updated;
  });

  emitQueueChanged(result.doctorId, { tokenId: result.id, status: result.status, action });
  return result;
}
