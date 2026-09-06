import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { created, ok } from "../utils/respond.js";
import {
  getDoctorQueue,
  getQueueMetrics,
  getTokenPosition,
  issueToken,
  serviceDateFor,
  transitionToken,
} from "../services/queue.service.js";
import { emitTokenIssued } from "../realtime/queueEvents.js";
import { serializeQueueEntry, serializeToken } from "../utils/serialize.js";

/** Resolve which board to read: a doctor sees their own unless told otherwise. */
function resolveDoctorId(req) {
  const requested = (req.query).doctorId;
  const own = req.staff?.doctorId ?? undefined;
  const id = requested ?? own;
  if (!id) {
    throw ApiError.badRequest("No doctor is linked to this account. Ask an administrator to link one.");
  }
  // A doctor may only read their own board; admins may read any.
  if (req.staff?.role === "DOCTOR" && own && id !== own) {
    throw ApiError.forbidden("You can only view your own queue.");
  }
  return id;
}

const dateFromQuery = (req) => {
  const d = (req.query).date;
  return d ? serviceDateFor(new Date(`${d}T00:00:00Z`)) : serviceDateFor();
};

/* ── Patient side ─────────────────────────────────────────── */

export async function createToken(req, res) {
  const { sessionId, doctorId } = req.body;
  const { token, reused } = await issueToken({ sessionId, doctorId });

  if (!reused) emitTokenIssued(doctorId, { tokenId: token.id, number: token.number });

  const { nowServing, patientsAhead, etaAt } = await getTokenPosition(token.id);
  const full = await prisma.queueToken.findUniqueOrThrow({
    where: { id: token.id },
    include: {
      doctor: { select: { name: true, room: true, department: { select: { name: true } } } },
      hospital: { select: { name: true } },
      session: { select: { name: true, age: true, sex: true } },
    },
  });

  const payload = serializeToken(full, { nowServing: nowServing?.number ?? null, patientsAhead, etaAt });
  return reused
    ? ok(res, payload, "You already hold a token for this visit.")
    : created(res, payload, "Token issued.");
}

/** Polled and pushed — the patient's own queue screen. */
export async function getToken(req, res) {
  const { token, nowServing, patientsAhead, etaAt } = await getTokenPosition(req.params.id);
  return ok(
    res,
    serializeToken(token, { nowServing: nowServing?.number ?? null, patientsAhead, etaAt }),
    "Token loaded."
);
}

/* ── Doctor side ──────────────────────────────────────────── */

export async function listQueue(req, res) {
  const doctorId = resolveDoctorId(req);
  const rows = await getDoctorQueue(doctorId, dateFromQuery(req));
  return ok(res, rows.map(serializeQueueEntry), "Queue loaded.");
}

export async function queueMetrics(req, res) {
  const doctorId = resolveDoctorId(req);
  const m = await getQueueMetrics(doctorId, dateFromQuery(req));

  return ok(
    res,
    {
      inQueue: m.inQueue,
      historyReady: m.historyReady,
      awaitingSignOff: m.awaitingSignOff,
      flagged: m.flagged,
      completedToday: m.completedToday,
      absentToday: m.absentToday,
      medianWaitMin: m.medianWaitMin,
      slotCapacity: m.slotCapacity,
      next: m.next ? serializeQueueEntry(m.next) : null,
      flaggedRows: m.flaggedRows.map(serializeQueueEntry),
      active: m.active.map(serializeQueueEntry),
    },
    "Metrics loaded."
);
}

/** call | start | complete | absent — validated against the state machine. */
export async function actOnToken(req, res) {
  const { id, action } = req.params;
  const updated = await transitionToken(id, action, req.staff.sub);
  return ok(res, { id: updated.id, number: updated.number, status: updated.status }, `Patient marked ${action}.`);
}
