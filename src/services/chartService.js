import { api } from "@/services/apiClient";

/**
 * One clinical chart, read from the database.
 *
 * The prototype fabricated a chart for every queue row and could only return
 * real data for whoever happened to use that exact browser. Now the chart is
 * keyed by token id and every field is traceable to something the patient
 * entered, a document they scanned, or a deterministic red-flag rule — which is
 * what the provenance badges in the UI are actually asserting.
 */



















export async function getPatientChart(tokenId) {
  if (!tokenId) return null;
  return api.get(`/charts/${tokenId}`);
}

/** Doctor edits the draft before signing. Rejected server-side once verified. */
export async function updateChartSummary(
  tokenId,
  patch
) {
  return api.patch(`/charts/${tokenId}/summary`, patch);
}

/** Verify & sign — the clinician takes responsibility for the record. */
export async function verifyChart(tokenId) {
  return api.post(`/charts/${tokenId}/verify`);
}

export function patientInitials(name) {
  const parts = name.replace(/\./g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
