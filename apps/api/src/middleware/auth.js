import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export const AUTH_COOKIE = "medikiosk_session";

export function signStaffToken(claims) {
  return jwt.sign(claims, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: "medikiosk",
  });
}

/**
 * httpOnly so a XSS on the shared kiosk cannot read a clinician's token —
 * the reason we do not keep it in localStorage the way the prototype did.
 */
export function setAuthCookie(res, token) {
  const isSecure = Boolean(env.COOKIE_SECURE || env.isProd);
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  const isSecure = Boolean(env.COOKIE_SECURE || env.isProd);
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    path: "/",
  });
}

function readToken(req) {
  const fromCookie = req.cookies?.[AUTH_COOKIE];
  if (typeof fromCookie === "string" && fromCookie) return fromCookie;
  // Bearer support keeps curl/Postman demos and tests simple.
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** Rejects the request unless a valid, still-active staff account is attached. */
export async function requireAuth(req, _res, next) {
  try {
    const token = readToken(req);
    if (!token) throw ApiError.unauthorized();

    let claims;
    try {
      claims = jwt.verify(token, env.JWT_SECRET, { issuer: "medikiosk" });
    } catch {
      throw ApiError.unauthorized("Your session has expired. Please sign in again.");
    }

    // Re-check the account each request so a deactivated user loses access immediately.
    const staff = await prisma.staffUser.findUnique({
      where: { id: claims.sub },
      select: { id: true, role: true, username: true, doctorId: true, isActive: true },
    });
    if (!staff || !staff.isActive) throw ApiError.unauthorized("This account is no longer active.");

    req.staff = { sub: staff.id, role: staff.role, username: staff.username, doctorId: staff.doctorId };
    next();
  } catch (err) {
    next(err);
  }
}

/** Role gate. Use after requireAuth. */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.staff) return next(ApiError.unauthorized());
    if (!roles.includes(req.staff.role)) {
      return next(ApiError.forbidden("This area is restricted to " + roles.join(" / ").toLowerCase() + " accounts."));
    }
    next();
  };
}
