/**
 * Keeps the facilities returned by the live map query addressable across routes
 * (and across a page refresh) without inventing any data of our own.
 */
const SESSION_KEY = "medikiosk.facilities.v2";

let memory = null;

export function saveFacilitySession(session) {
  memory = session;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* over the quota — in-memory copy still serves this session */
  }
}

export function readFacilitySession() {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.hospitals) return null;
    memory = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function getFacility(id) {
  if (!id) return null;
  const session = readFacilitySession();
  return session?.hospitals.find(h => h.id === id) ?? null;
}

export function facilityMapUrl(h) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${h.lon - 0.012}%2C${h.lat - 0.008}%2C${h.lon + 0.012}%2C${h.lat + 0.008}&layer=mapnik&marker=${h.lat}%2C${h.lon}`;
}

/**
 * Link the facility the patient selected to a real database row.
 *
 * Discovery stays in the browser (OpenStreetMap, already resilient with three
 * mirrors and a cache) — but the moment a patient commits to a hospital we
 * upsert it server-side by its OSM reference. That gives the visit a stable
 * hospital id, provisions the department/doctor roster once, and lets the
 * doctor see which building their patient is standing in.
 */
export async function syncHospital(h) {
  const { api } = await import("@/services/apiClient");
  const data = await api.post("/hospitals/sync", {
    osmType: h.osmType,
    osmId: h.osmId,
    name: h.name,
    address: h.address,
    lat: h.lat,
    lon: h.lon,
    phone: h.phone,
    website: h.website,
    emergency: h.emergency ?? false,
    specialities: h.specialities ?? [],
  });
  rememberDbId(h.id, data.hospitalId);
  return data.hospitalId;
}

/** OSM id (used in routes) → database id (used by the API). */
const DB_ID_KEY = "medikiosk.hospital.dbids.v1";

function readDbIds() {
  try {
    return JSON.parse(localStorage.getItem(DB_ID_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function rememberDbId(osmKey, dbId) {
  try {
    localStorage.setItem(DB_ID_KEY, JSON.stringify({ ...readDbIds(), [osmKey]: dbId }));
  } catch {
    /* ignore */
  }
}

export function dbIdFor(osmKey) {
  return osmKey ? (readDbIds()[osmKey] ?? null) : null;
}

/** Resolve the database id for a facility, syncing it first if necessary. */
export async function ensureHospitalDbId(h) {
  return dbIdFor(h.id) ?? (await syncHospital(h));
}
