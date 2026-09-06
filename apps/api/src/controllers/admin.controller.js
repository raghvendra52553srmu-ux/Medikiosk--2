import { TokenStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ok } from "../utils/respond.js";
import { serviceDateFor } from "../services/queue.service.js";
import { fmtTime, initialsOf, serializeAudit } from "../utils/serialize.js";

/**
 * Operations view. Every number here is a real aggregate query — the prototype
 * dashboard just mapped a hardcoded array of staff (and printed their
 * passwords, which is now impossible: no endpoint returns a credential).
 */
export async function overview(_req, res) {
  const today = serviceDateFor();

  const [
    inQueue,
    completedToday,
    absentToday,
    issuedToday,
    sessionsToday,
    documentsToday,
    flaggedToday,
    verifiedToday,
    doctorCount,
    hospitalCount,
    kiosks,
  ] = await Promise.all([
    prisma.queueToken.count({
      where: { serviceDate: today, status: { in: [TokenStatus.WAITING, TokenStatus.ALMOST, TokenStatus.CALLED, TokenStatus.IN_CONSULTATION] } },
    }),
    prisma.queueToken.count({ where: { serviceDate: today, status: TokenStatus.COMPLETED } }),
    prisma.queueToken.count({ where: { serviceDate: today, status: TokenStatus.ABSENT } }),
    prisma.queueToken.count({ where: { serviceDate: today } }),
    prisma.patientSession.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
    prisma.document.count({ where: { createdAt: { gte: today } } }),
    prisma.redFlag.count({ where: { createdAt: { gte: today } } }),
    prisma.clinicalSummary.count({ where: { verifiedAt: { gte: today } } }),
    prisma.doctor.count(),
    prisma.hospital.count(),
    prisma.kioskDevice.findMany({ orderBy: { lastSeenAt: "desc" }, take: 12 }),
  ]);

  // Average consultation length today, from real timestamps.
  const completed = await prisma.queueToken.findMany({
    where: { serviceDate: today, status: TokenStatus.COMPLETED, startedAt: { not: null }, completedAt: { not: null } },
    select: { startedAt: true, completedAt: true },
  });
  const avgConsultMin =
    completed.length === 0
      ? 0
      : Math.round(
          completed.reduce((s, t) => s + (t.completedAt.getTime() - t.startedAt.getTime()), 0) /
            completed.length /
            60_000
);

  // Per-doctor load for the operations table.
  const byDoctor = await prisma.doctor.findMany({
    include: {
      department: { select: { name: true } },
      hospital: { select: { name: true } },
      _count: {
        select: {
          tokens: {
            where: {
              serviceDate: today,
              status: { in: [TokenStatus.WAITING, TokenStatus.ALMOST, TokenStatus.CALLED, TokenStatus.IN_CONSULTATION] },
            },
          },
        },
      },
    },
  });

  const load = byDoctor
    .map((d) => ({
      id: d.id,
      name: d.name,
      initials: initialsOf(d.name),
      department: d.department.name,
      hospital: d.hospital.name,
      room: d.room,
      waiting: d._count.tokens,
      capacity: Math.floor((d.opdEndMin - d.opdStartMin) / d.slotMinutes),
      isAvailable: d.isAvailable,
    }))
    // Busiest first, and drop the long tail of idle doctors — an operations
    // screen should show where the pressure is, not 19 empty progress bars.
    .sort((a, b) => b.waiting - a.waiting)
    .filter((d, i) => d.waiting > 0 || i < 5);

  return ok(
    res,
    {
      today: {
        inQueue,
        issuedToday,
        completedToday,
        absentToday,
        sessionsToday,
        documentsToday,
        flaggedToday,
        verifiedToday,
        avgConsultMin,
        throughputPct: issuedToday === 0 ? 0 : Math.round((completedToday / issuedToday) * 100),
      },
      totals: { doctors: doctorCount, hospitals: hospitalCount, kiosks: kiosks.length },
      load: load.slice(0, 12),
      kiosks: kiosks.map((k) => ({
        id: k.id,
        name: k.name,
        status: k.status.toLowerCase(),
        lastActive: fmtTime(k.lastSeenAt),
      })),
    },
    "Overview loaded."
);
}

/** Staff directory. Note: no password field is ever selected. */
export async function listStaff(_req, res) {
  const staff = await prisma.staffUser.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      department: true,
      qualification: true,
      isActive: true,
      lastLoginAt: true,
      doctor: { select: { id: true, room: true, department: { select: { name: true } } } },
    },
  });

  return ok(
    res,
    staff.map((s) => ({
      id: s.id,
      username: s.username,
      email: s.email,
      name: s.name,
      role: s.role.toLowerCase(),
      department: s.department ?? s.doctor?.department.name ?? null,
      qualification: s.qualification,
      room: s.doctor?.room ?? null,
      status: s.isActive ? "Active" : "Disabled",
      lastLogin: s.lastLoginAt ? fmtTime(s.lastLoginAt) : "Never",
      initials: initialsOf(s.name),
    })),
    "Staff loaded."
);
}

/** Paginated audit log — the compliance story. */
export async function listAudit(req, res) {
  const { page, pageSize, entity } = req.query;
  const where = entity ? { entity } : {};

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { staff: { select: { name: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return ok(
    res,
    {
      items: rows.map((r) => ({ ...serializeAudit(r), entity: r.entity, date: r.createdAt })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    "Audit trail loaded."
);
}
