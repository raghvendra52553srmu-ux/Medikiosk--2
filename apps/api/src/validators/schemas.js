import { z } from "zod";

/**
 * One source of truth for request shapes. The rules mirror the checks the
 * frontend already performs (10-digit Indian mobile, age 1-120, name >= 3),
 * so client and server agree instead of drifting.
 */

export const cuid = z.string().min(1).max(64);

export const idParam = z.object({ id: cuid });

/* ── Auth ─────────────────────────────────────────────────── */

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email.").max(120),
  password: z.string().min(1, "Enter your password.").max(200),
});

/* ── Patient session ──────────────────────────────────────── */

export const sexSchema = z.enum(["M", "F", "O"]);

export const createSessionSchema = z.object({
  name: z.string().trim().min(3, "Enter the full name (at least 3 letters).").max(120),
  age: z.coerce.number().int().min(1, "Enter an age between 1 and 120.").max(120),
  sex: sexSchema,
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
  language: z.string().trim().min(2).max(12).default("en"),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required to continue." }) }),
  kioskName: z.string().trim().max(80).optional(),
});

export const updateSessionSchema = z
  .object({
    problemText: z.string().trim().max(2000).optional(),
    problemPresetId: z.string().trim().max(80).optional(),
    language: z.string().trim().min(2).max(12).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

/* ── Hospital sync (from the OSM payload the kiosk already has) ── */

export const syncHospitalSchema = z.object({
  osmType: z.enum(["node", "way", "relation"]),
  osmId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().max(400).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  phone: z.string().trim().max(60).optional(),
  website: z.string().trim().max(300).optional(),
  emergency: z.boolean().optional(),
  specialities: z.array(z.string().trim().max(80)).max(40).default([]),
});

/* ── Tokens ───────────────────────────────────────────────── */

export const issueTokenSchema = z.object({
  sessionId: cuid,
  doctorId: cuid,
});

/* ── History ──────────────────────────────────────────────── */

export const answerSchema = z.object({
  value: z.union([z.string().max(2000), z.array(z.string().max(200)).max(20)]),
});

export const answerParams = z.object({ id: cuid, questionId: z.string().regex(/^q\d{1,2}$/) });

/* ── Documents ────────────────────────────────────────────── */

export const documentTypeSchema = z.enum([
  "PRESCRIPTION",
  "LAB_REPORT",
  "DISCHARGE_SUMMARY",
  "IMAGING",
  "OTHER",
]);

export const createDocumentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: documentTypeSchema.default("OTHER"),
  extractedText: z.string().max(20_000).optional(),
  ocrConfidence: z.coerce.number().min(0).max(100).optional(),
  // Small thumbnail only — the full scan stays on the device.
  thumbDataUrl: z
    .string()
    .max(400_000, "That image is too large to attach.")
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, "Unsupported image format.")
    .optional(),
});

/* ── Doctor / chart ───────────────────────────────────────── */

export const queueQuerySchema = z.object({
  doctorId: cuid.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const tokenActionParams = z.object({
  id: cuid,
  action: z.enum(["call", "start", "complete", "absent"]),
});

export const updateSummarySchema = z
  .object({
    chiefComplaint: z.string().trim().max(500).optional(),
    historyOfPresentIllness: z.string().trim().max(5000).optional(),
    pastMedicalHistory: z.string().trim().max(3000).optional(),
    medications: z.array(z.string().trim().max(300)).max(50).optional(),
    allergies: z.array(z.string().trim().max(200)).max(50).optional(),
    familyHistory: z.string().trim().max(2000).optional(),
    socialHistory: z.string().trim().max(2000).optional(),
    reviewOfSystems: z.string().trim().max(3000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

export const doctorsQuerySchema = z.object({
  hospitalId: cuid.optional(),
  department: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
});

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  entity: z.string().trim().max(60).optional(),
});
