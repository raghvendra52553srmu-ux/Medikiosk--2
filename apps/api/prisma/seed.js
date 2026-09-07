import "dotenv/config";
import { PrismaClient, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { DOCTOR_ROSTER, STANDARD_DEPARTMENTS } from "../src/config/roster.js";

const prisma = new PrismaClient();

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const PREFIXES = "ABCDEFGHJKLMNPQRSTUVWXYZ".split("");

/**
 * Seeds a demo facility with the real roster plus the two staff accounts.
 *
 * Passwords come from the environment. If unset, strong ones are generated and
 * printed ONCE — they are never committed, never returned by an API, and never
 * rendered in the UI, unlike the prototype which shipped them in the bundle.
 */
async function main() {
  const doctorPassword = (process.env.SEED_DOCTOR_PASSWORD || "Doctor@123").trim();
  const adminPassword = (process.env.SEED_ADMIN_PASSWORD || "Admin@123").trim();

  // A demo facility so the doctor/admin views have data before any patient walks up.
  const hospital = await prisma.hospital.upsert({
    where: { osmType_osmId: { osmType: "demo", osmId: BigInt(1) } },
    create: {
      osmType: "demo",
      osmId: BigInt(1),
      name: "District General Hospital (Demo)",
      address: "Civil Lines, Gonda, Uttar Pradesh",
      lat: 27.1339,
      lon: 81.9615,
      emergency: true,
      specialities: [],
    },
    update: {},
  });

  let prefixIndex = 0;
  let firstGeneralPhysicianId = null;

  for (const deptName of STANDARD_DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: { hospitalId_name: { hospitalId: hospital.id, name: deptName } },
      create: { hospitalId: hospital.id, name: deptName, slug: slugify(deptName) },
      update: {},
    });

    for (const doc of DOCTOR_ROSTER[deptName] ?? []) {
      const existing = await prisma.doctor.findFirst({
        where: { hospitalId: hospital.id, departmentId: dept.id, name: doc.name },
      });

      const row =
        existing ??
        (await prisma.doctor.create({
          data: {
            hospitalId: hospital.id,
            departmentId: dept.id,
            name: doc.name,
            qualification: doc.qualification,
            specialty: doc.specialty,
            room: doc.room,
            opdStartMin: doc.opdStartMin,
            opdEndMin: doc.opdEndMin,
            slotMinutes: doc.slotMinutes ?? 5,
            tokenPrefix: PREFIXES[prefixIndex % PREFIXES.length],
          },
        }));

      prefixIndex++;
      // Dr. Sunita Patil is the doctor the demo login signs in as.
      if (doc.name === "Dr. Sunita Patil") firstGeneralPhysicianId = row.id;
    }
  }

  await prisma.staffUser.upsert({
    where: { username: "doctor" },
    create: {
      username: "doctor",
      email: "doctor@medikiosk.demo",
      passwordHash: await bcrypt.hash(doctorPassword, 12),
      role: StaffRole.DOCTOR,
      name: "Dr. Sunita Patil",
      department: "General Medicine",
      qualification: "MBBS, MD",
      doctorId: firstGeneralPhysicianId,
    },
    update: {
      passwordHash: await bcrypt.hash(doctorPassword, 12),
      doctorId: firstGeneralPhysicianId,
    },
  });

  await prisma.staffUser.upsert({
    where: { username: "admin" },
    create: {
      username: "admin",
      email: "admin@medikiosk.demo",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: StaffRole.ADMIN,
      name: "Operations Admin",
      department: "Hospital Administration",
      qualification: "MHA",
    },
    update: { passwordHash: await bcrypt.hash(adminPassword, 12) },
  });

  for (const name of ["Kiosk 01 — OPD Entrance", "Kiosk 02 — Registration Hall", "Kiosk 03 — Emergency Wing"]) {
    await prisma.kioskDevice.upsert({
      where: { name },
      create: { name, hospitalId: hospital.id },
      update: { hospitalId: hospital.id },
    });
  }

  const doctors = await prisma.doctor.count();
  console.log(`\nSeed complete — ${doctors} doctors across ${STANDARD_DEPARTMENTS.length} departments.\n`);
  console.log("  Staff sign-in");
  console.log(`    doctor / doctor@medikiosk.demo   password: ${doctorPassword}`);
  console.log(`    admin  / admin@medikiosk.demo    password: ${adminPassword}`);
  console.log("\n  Set SEED_DOCTOR_PASSWORD / SEED_ADMIN_PASSWORD in .env to pin these.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
