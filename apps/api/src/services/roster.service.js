import { prisma } from "../config/prisma.js";
import { DOCTOR_ROSTER, SPECIALITY_ALIASES, STANDARD_DEPARTMENTS } from "../config/roster.js";

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Give each doctor in a facility a distinct token prefix so boards stay readable. */
const PREFIXES = "ABCDEFGHJKLMNPQRSTUVWXYZ".split("");

/**
 * OSM tells us a hospital exists and roughly what it offers, but no public API
 * exposes a real OPD roster. When a patient first selects a facility we
 * provision its departments and consultants once, then persist them — so the
 * roster is stable across visits, devices and refreshes, instead of being
 * re-derived from a hash on every render the way the prototype did.
 */
export async function ensureHospitalRoster(hospitalId, specialities = []) {
  const existing = await prisma.department.count({ where: { hospitalId } });
  if (existing > 0) return;

  // Map the OSM speciality tags onto our canonical department names.
  const mapped = specialities
    .map((s) => SPECIALITY_ALIASES[s] ?? SPECIALITY_ALIASES[s.trim()] ?? null)
    .filter((v) => Boolean(v));

  const wanted = new Set(mapped);
  const departments = wanted.size
    ? STANDARD_DEPARTMENTS.filter((d) => wanted.has(d))
    : STANDARD_DEPARTMENTS;

  // General Medicine is the fallback OPD every facility must be able to offer.
  const finalDepts = departments.includes("General Medicine")
    ? departments
    : ["General Medicine", ...departments];

  let prefixIndex = 0;

  await prisma.$transaction(async (tx) => {
    for (const deptName of finalDepts) {
      const dept = await tx.department.create({
        data: { hospitalId, name: deptName, slug: slugify(deptName) },
      });

      const roster = DOCTOR_ROSTER[deptName] ?? DOCTOR_ROSTER["General Medicine"];
      for (const doc of roster) {
        await tx.doctor.create({
          data: {
            hospitalId,
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
        });
        prefixIndex++;
      }
    }
  });
}
