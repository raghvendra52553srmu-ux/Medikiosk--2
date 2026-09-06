import { api } from "@/services/apiClient";
import { ensureHospitalDbId } from "@/services/hospitalService";

/**
 * Departments and consultants now come from the database.
 *
 * The previous implementation derived a roster from a hash of the hospital id on
 * every render, so the "same" doctor could carry a different id between screens
 * and a queue could never be attached to them. The roster is provisioned once
 * per facility server-side and then read — stable across screens, devices and
 * refreshes. The names, rooms and OPD timings are the same ones this app has
 * always shown; they were migrated verbatim into the seed.
 */

export async function getDepartments(hospital) {
  const hospitalId = await ensureHospitalDbId(hospital);
  return api.get(`/departments?hospitalId=${encodeURIComponent(hospitalId)}`);
}

export async function getDoctors(
  hospital,
  opts = {}
) {
  const hospitalId = await ensureHospitalDbId(hospital);
  const params = new URLSearchParams({ hospitalId });
  if (opts.department) params.set("department", opts.department);
  if (opts.q) params.set("q", opts.q);
  return api.get(`/doctors?${params.toString()}`);
}

export async function getDoctorById(doctorId) {
  return api.get(`/doctors/${doctorId}`);
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
