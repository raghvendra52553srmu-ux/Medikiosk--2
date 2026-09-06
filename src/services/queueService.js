import { api } from "@/services/apiClient";

/**
 * The doctor's board — now a real, shared queue.
 *
 * Previously this file held a hardcoded nine-patient SEED array plus localStorage
 * overrides, which meant each browser saw its own private fiction. Every read
 * below is a live query against the same Postgres rows the kiosk writes to, so a
 * patient registering on one device appears on the doctor's screen on another.
 */















export async function getDoctorQueue(doctorId) {
  const qs = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : "";
  return api.get(`/queue${qs}`);
}

export async function getQueueMetrics(doctorId) {
  const qs = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : "";
  return api.get(`/queue/metrics${qs}`);
}

/* ── Mutations ────────────────────────────────────────────────
 * Each is a server-side state-machine transition: an illegal move
 * (completing an already-completed patient) is rejected, not applied.
 * ---------------------------------------------------------- */



const act = (tokenId, action) =>
  api.post(`/queue/${tokenId}/${action}`);

export const callPatient = (tokenId) => act(tokenId, "call");
export const startConsultation = (tokenId) => act(tokenId, "start");
export const completePatient = (tokenId) => act(tokenId, "complete");
export const markAbsent = (tokenId) => act(tokenId, "absent");

;
