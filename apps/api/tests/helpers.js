import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

export const app = createApp();
export const api = () => request(app);

/** Sign in and return the Bearer token, avoiding cookie juggling in tests. */
export async function loginAs(identifier, password) {
  const res = await api().post("/api/auth/login").send({ identifier, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${res.text}`);
  return res.body.data.token;
}

let counter = 0;
/** Unique 10-digit Indian mobile per call so sessions never collide. */
export const uniqueMobile = () => `9${String(800000000 + (counter++) + Date.now() % 100000).slice(0, 9)}`;

export async function createSession(overrides = {}) {
  const res = await api()
    .post("/api/sessions")
    .send({ name: "Test Patient", age: 40, sex: "F", mobile: uniqueMobile(), consent: true, ...overrides });
  if (res.status !== 201) throw new Error(`session failed: ${res.text}`);
  return res.body.data.sessionId;
}

export async function firstDoctorId() {
  const doc = await prisma.doctor.findFirstOrThrow({ where: { isAvailable: true } });
  return doc.id;
}

/**
 * The doctor row the seeded "doctor" login actually acts as. Charts are scoped
 * to the clinician's own queue, so tests that sign in must use this one.
 */
export async function ownDoctorId() {
  const staff = await prisma.staffUser.findUniqueOrThrow({ where: { username: "doctor" } });
  if (!staff.doctorId) throw new Error("seed did not link the doctor account to a doctor row");
  return staff.doctorId;
}

/** Remove only what a test created. */
export async function cleanupSessions(names) {
  await prisma.patientSession.deleteMany({ where: { name: { in: names } } });
}
