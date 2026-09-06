import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ok } from "../utils/respond.js";
import { serializeDoctor } from "../utils/serialize.js";
import { serviceDateFor } from "../services/queue.service.js";
import { ensureHospitalRoster } from "../services/roster.service.js";

/**
 * Facility discovery stays in the browser (OpenStreetMap, already resilient with
 * three mirrors and a cache). What lands here is the facility the patient
 * actually CHOSE — upserted by OSM ref so repeat visits reuse the same row and
 * the doctor can see where their patient is standing.
 */
export async function syncHospital(req, res) {
  const body = req.body

;

  const hospital = await prisma.hospital.upsert({
    where: { osmType_osmId: { osmType: body.osmType, osmId: BigInt(body.osmId) } },
    create: {
      osmType: body.osmType,
      osmId: BigInt(body.osmId),
      name: body.name,
      address: body.address,
      lat: body.lat,
      lon: body.lon,
      phone: body.phone,
      website: body.website,
      emergency: body.emergency ?? false,
      specialities: body.specialities,
    },
    update: {
      name: body.name,
      address: body.address,
      lat: body.lat,
      lon: body.lon,
      phone: body.phone,
      website: body.website,
      emergency: body.emergency ?? false,
      specialities: body.specialities,
    },
  });

  // A real facility needs a roster before a patient can pick a doctor.
  await ensureHospitalRoster(hospital.id, body.specialities);

  return ok(res, { hospitalId: hospital.id, name: hospital.name }, "Facility linked.");
}

export async function listDepartments(req, res) {
  const { hospitalId } = req.query;
  if (!hospitalId) throw ApiError.badRequest("A facility must be selected first.");

  const departments = await prisma.department.findMany({
    where: { hospitalId },
    orderBy: { name: "asc" },
    include: { _count: { select: { doctors: true } } },
  });

  return ok(
    res,
    departments.map((d) => ({ id: d.id, name: d.name, slug: d.slug, doctors: d._count.doctors })),
    "Departments loaded."
);
}

export async function listDoctors(req, res) {
  const { hospitalId, department, q } = req.query;
  if (!hospitalId) throw ApiError.badRequest("A facility must be selected first.");

  const doctors = await prisma.doctor.findMany({
    where: {
      hospitalId,
      // MySQL's default collation (utf8mb4_general_ci / unicode_ci) is already
      // case-insensitive for contains/equals, and Prisma's `mode: "insensitive"`
      // argument is Postgres-only — passing it here would throw a validation
      // error against a MySQL datasource, so it's simply omitted.
      ...(department ? { department: { name: { equals: department } } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { specialty: { contains: q } },
              { department: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      department: { select: { name: true } },
      // Live queue size drives the wait estimate the patient sees.
      _count: {
        select: {
          tokens: {
            where: {
              serviceDate: serviceDateFor(),
              status: { in: ["WAITING", "ALMOST", "CALLED", "IN_CONSULTATION"] },
            },
          },
        },
      },
    },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  });

  return ok(res, doctors.map(serializeDoctor), "Doctors loaded.");
}

export async function getDoctor(req, res) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: req.params.id },
    include: {
      department: { select: { name: true } },
      hospital: { select: { id: true, name: true, address: true, phone: true } },
      _count: {
        select: {
          tokens: {
            where: {
              serviceDate: serviceDateFor(),
              status: { in: ["WAITING", "ALMOST", "CALLED", "IN_CONSULTATION"] },
            },
          },
        },
      },
    },
  });
  if (!doctor) throw ApiError.notFound("That doctor is not listed at this facility.");

  return ok(res, { ...serializeDoctor(doctor), hospital: doctor.hospital }, "Doctor loaded.");
}
