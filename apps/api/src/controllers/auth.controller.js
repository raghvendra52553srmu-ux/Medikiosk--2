import { ActorType } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ok } from "../utils/respond.js";
import { verifyPassword } from "../utils/crypto.js";
import { clearAuthCookie, setAuthCookie, signStaffToken } from "../middleware/auth.js";
import { recordAudit } from "../services/audit.service.js";

/** Never reveal which half of the pair was wrong. */
const INVALID = "Invalid username/email or password.";

export async function login(req, res) {
  const { identifier, password } = req.body;
  const id = identifier.toLowerCase();

  const staff = await prisma.staffUser.findFirst({
    where: { OR: [{ username: id }, { email: id }] },
    include: { doctor: { select: { id: true, name: true, department: { select: { name: true } } } } },
  });

  // Compare against a dummy hash when the user is missing so the response time
  // does not leak whether the account exists.
  const hash = staff?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvaliduO";
  const valid = await verifyPassword(password, hash);

  if (!staff || !valid) throw ApiError.unauthorized(INVALID);
  if (!staff.isActive) throw ApiError.forbidden("This account has been deactivated.");

  const token = signStaffToken({
    sub: staff.id,
    role: staff.role,
    username: staff.username,
    doctorId: staff.doctorId,
  });
  setAuthCookie(res, token);

  await prisma.staffUser.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });
  await recordAudit({
    actorType: ActorType.STAFF,
    staffId: staff.id,
    action: `${staff.role} signed in`,
    entity: "StaffUser",
    entityId: staff.id,
  });

  return ok(
    res,
    {
      // Bearer copy for non-browser clients; browsers use the httpOnly cookie.
      token,
      user: {
        id: staff.id,
        username: staff.username,
        email: staff.email,
        name: staff.name,
        role: staff.role.toLowerCase(),
        department: staff.department,
        qualification: staff.qualification,
        doctorId: staff.doctorId,
        doctorName: staff.doctor?.name,
      },
    },
    "Signed in successfully."
);
}

export async function logout(req, res) {
  if (req.staff) {
    await recordAudit({
      actorType: ActorType.STAFF,
      staffId: req.staff.sub,
      action: "Signed out",
      entity: "StaffUser",
      entityId: req.staff.sub,
    });
  }
  clearAuthCookie(res);
  return ok(res, null, "Signed out.");
}

/** Lets the SPA restore its session on reload without keeping a token in JS. */
export async function me(req, res) {
  const staff = await prisma.staffUser.findUnique({
    where: { id: req.staff.sub },
    include: { doctor: { select: { id: true, name: true, department: { select: { name: true } } } } },
  });
  if (!staff) throw ApiError.unauthorized();

  return ok(
    res,
    {
      id: staff.id,
      username: staff.username,
      email: staff.email,
      name: staff.name,
      role: staff.role.toLowerCase(),
      department: staff.department,
      qualification: staff.qualification,
      doctorId: staff.doctorId,
      doctorName: staff.doctor?.name,
    },
    "Session active."
);
}
