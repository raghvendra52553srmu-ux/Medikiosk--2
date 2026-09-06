import { api } from "./apiClient.js";
import { ensureHospitalDbId } from "./hospitalService.js";
import {
  DOCTOR_ROSTER,
  SPECIALITY_ALIASES,
  STANDARD_DEPARTMENTS,
  initialsOf,
  minToLabel,
  slugify,
} from "../data/doctorRoster.js";

/**
 * Calculates geographic distance in kilometers between two points using the Haversine formula.
 * Normalizes input coordinates to numbers safely.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const la1 = Number(lat1);
  const lo1 = Number(lon1);
  const la2 = Number(lat2);
  const lo2 = Number(lon2);

  if (
    !Number.isFinite(la1) ||
    !Number.isFinite(lo1) ||
    !Number.isFinite(la2) ||
    !Number.isFinite(lo2)
  ) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((la2 - la1) * Math.PI) / 180;
  const dLon = ((lo2 - lo1) * Math.PI) / 180;
  const radLat1 = (la1 * Math.PI) / 180;
  const radLat2 = (la2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Inspects all possible fields where doctor / hospital coordinates might be stored
 * and safely converts them to numbers.
 */
export function extractDoctorCoordinates(doc) {
  if (!doc) return null;

  const rawLat =
    doc.lat ??
    doc.latitude ??
    doc.location?.lat ??
    doc.location?.latitude ??
    doc.hospital?.lat ??
    doc.hospital?.latitude;

  const rawLon =
    doc.lon ??
    doc.lng ??
    doc.longitude ??
    doc.location?.lon ??
    doc.location?.lng ??
    doc.location?.longitude ??
    doc.hospital?.lon ??
    doc.hospital?.lng ??
    doc.hospital?.longitude;

  const lat = Number(rawLat);
  const lon = Number(rawLon);

  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return { lat, lon };
  }
  return null;
}

export function formatDistance(km) {
  if (km == null || !Number.isFinite(km)) return "Distance unknown";
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/** In-memory cache for doctor lookups */
const doctorMemoryCache = new Map();

/**
 * Generate fallback doctor roster for a facility using the canonical roster.
 */
function generateFacilityRoster(hospital, filterDept = null) {
  const coords = extractDoctorCoordinates(hospital) || {
    lat: Number(hospital?.lat ?? 0),
    lon: Number(hospital?.lon ?? hospital?.lng ?? 0),
  };

  const results = [];
  const deptsToInclude = filterDept
    ? [filterDept]
    : STANDARD_DEPARTMENTS;

  for (const deptName of deptsToInclude) {
    const roster = DOCTOR_ROSTER[deptName] ?? DOCTOR_ROSTER["General Medicine"] ?? [];
    roster.forEach((doc, idx) => {
      const docId = `${hospital.id || "hosp"}-${slugify(deptName)}-${slugify(doc.name)}`;
      const waitMins = Math.max(5, (2 + (doc.name.length % 5)) * (doc.slotMinutes || 5));

      const doctorObj = {
        id: docId,
        name: doc.name,
        qualification: doc.qualification,
        specialty: doc.specialty,
        department: deptName,
        room: doc.room || `${101 + idx}`,
        opdTiming: doc.opdTiming || `${minToLabel(doc.opdStartMin)} – ${minToLabel(doc.opdEndMin)}`,
        available: true,
        isAvailable: true,
        queueSize: 2 + (doc.name.length % 5),
        estimatedWait: `${waitMins} min`,
        nextSlot: "Today",
        initials: initialsOf(doc.name),
        hospital: {
          ...hospital,
          lat: coords.lat,
          lon: coords.lon,
          latitude: coords.lat,
          longitude: coords.lon,
        },
        lat: coords.lat,
        lon: coords.lon,
        latitude: coords.lat,
        longitude: coords.lon,
        location: {
          lat: coords.lat,
          lon: coords.lon,
          latitude: coords.lat,
          longitude: coords.lon,
        },
      };

      doctorMemoryCache.set(docId, doctorObj);
      results.push(doctorObj);
    });
  }

  return results;
}

export async function getDepartments(hospital) {
  try {
    const hospitalId = await ensureHospitalDbId(hospital);
    const data = await api.get(`/departments?hospitalId=${encodeURIComponent(hospitalId)}`);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // API not reachable, use standard departments
  }

  return STANDARD_DEPARTMENTS.map((name) => ({
    id: slugify(name),
    name,
    slug: slugify(name),
    doctors: DOCTOR_ROSTER[name]?.length ?? 2,
  }));
}

export async function getDoctors(hospital, opts = {}) {
  const coords = extractDoctorCoordinates(hospital);

  try {
    const hospitalId = await ensureHospitalDbId(hospital);
    const params = new URLSearchParams({ hospitalId });
    if (opts.department) params.set("department", opts.department);
    if (opts.q) params.set("q", opts.q);

    const serverDocs = await api.get(`/doctors?${params.toString()}`);
    if (Array.isArray(serverDocs) && serverDocs.length > 0) {
      // Normalize server doctor coordinates and hospital metadata
      const normalized = serverDocs.map((doc) => {
        const docCoords = extractDoctorCoordinates(doc) || coords;
        const normDoc = {
          ...doc,
          available: doc.available ?? doc.isAvailable ?? true,
          hospital: {
            ...(doc.hospital || hospital),
            lat: docCoords ? docCoords.lat : Number(hospital.lat),
            lon: docCoords ? docCoords.lon : Number(hospital.lon),
          },
          lat: docCoords ? docCoords.lat : Number(hospital.lat),
          lon: docCoords ? docCoords.lon : Number(hospital.lon),
          latitude: docCoords ? docCoords.lat : Number(hospital.lat),
          longitude: docCoords ? docCoords.lon : Number(hospital.lon),
        };
        doctorMemoryCache.set(normDoc.id, normDoc);
        return normDoc;
      });
      return normalized;
    }
  } catch {
    // Fall back to canonical roster
  }

  // Generate fallback roster for this facility
  return generateFacilityRoster(hospital, opts.department);
}

export async function getDoctorById(doctorId) {
  try {
    const doc = await api.get(`/doctors/${doctorId}`);
    if (doc) {
      doctorMemoryCache.set(doctorId, doc);
      return doc;
    }
  } catch {
    // Fall back to cached or memory doctor
  }

  if (doctorMemoryCache.has(doctorId)) {
    return doctorMemoryCache.get(doctorId);
  }

  // Search canonical roster by doctorId
  for (const dept of STANDARD_DEPARTMENTS) {
    const roster = DOCTOR_ROSTER[dept] ?? [];
    for (const doc of roster) {
      if (doctorId.includes(slugify(doc.name))) {
        const dummyHosp = {
          id: "facility-default",
          name: "Local Health Facility",
          address: "City Healthcare Center",
          lat: 0,
          lon: 0,
        };
        return {
          id: doctorId,
          name: doc.name,
          qualification: doc.qualification,
          specialty: doc.specialty,
          department: dept,
          room: doc.room || "101",
          opdTiming: `${minToLabel(doc.opdStartMin)} – ${minToLabel(doc.opdEndMin)}`,
          available: true,
          queueSize: 3,
          estimatedWait: "15 min",
          nextSlot: "Today",
          initials: initialsOf(doc.name),
          hospital: dummyHosp,
        };
      }
    }
  }

  throw new Error("Doctor not found");
}

/**
 * Maps a free-text complaint / triage preset onto the department most likely to
 * handle it. Deliberately a transparent keyword map rather than a model: the
 * patient can always override the suggestion, and a wrong-but-explainable
 * routing is safer in a clinic than an opaque one.
 */
const TRIAGE_ROUTES = [
  { department: "Cardiology", patterns: /chest|heart|palpitation|bp|blood pressure|हृदय|छाती|दिल/i },
  { department: "Orthopaedics", patterns: /bone|joint|knee|back pain|fracture|sprain|हड्डी|जोड़|कमर/i },
  { department: "Paediatrics", patterns: /child|baby|infant|kid|बच्चा|शिशु/i },
  { department: "Dermatology", patterns: /skin|rash|itch|acne|त्वचा|खुजली|दाने/i },
  { department: "Ophthalmology", patterns: /eye|vision|sight|blurred|आँख|दृष्टि/i },
  { department: "ENT", patterns: /ear|nose|throat|hearing|sinus|कान|नाक|गला/i },
  { department: "Neurology", patterns: /headache|migraine|seizure|numbness|stroke|सिरदर्द|मिर्गी/i },
  { department: "Obstetrics & Gynaecology", patterns: /pregnan|period|menstrual|gynae|प्रसव|माहवारी|गर्भ/i },
  { department: "Dental", patterns: /tooth|teeth|dental|gum|दांत|मसूड़/i },
  { department: "General Surgery", patterns: /lump|hernia|swelling|piles|गांठ|सूजन/i },
];

/** Returns the suggested department name, or General Medicine as the safe default. */
export function suggestDepartment(problemText) {
  if (!problemText?.trim()) return "General Medicine";
  const match = TRIAGE_ROUTES.find((r) => r.patterns.test(problemText));
  return match?.department ?? "General Medicine";
}
