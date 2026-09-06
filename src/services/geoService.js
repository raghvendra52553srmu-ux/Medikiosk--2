/**
 * Real facility discovery. Nothing here is invented: names, addresses, phones,
 * opening hours and specialities all come from OpenStreetMap tags, and distance
 * is haversine from the device's actual fix.
 *
 *   Overpass (3 public mirrors, raced in parallel — first answer wins)
 *     → hospitals/clinics inside a radius
 *   Nominatim → reverse geocode of the fix, and forward search of typed areas
 *   Photon    → backup place search, so a Nominatim 429 or blocked domain
 *               can never strand a patient mid-visit
 */

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.jp/api/interpreter",
];
const NOMINATIM = "https://nominatim.openstreetmap.org";
const PHOTON = "https://photon.komoot.io/api/";
const CACHE_KEY = "medikiosk.geo.v3";
const CACHE_TTL_MS = 10 * 60 * 1000;
const BASE_RADIUS_M = 15000;
const WIDE_RADIUS_M = 20000;
const OVERPASS_TIMEOUT_MS = 8_000;
const GEOCODE_TIMEOUT_MS = 10_000;
const REVERSE_TIMEOUT_MS = 8_000;










export class GeocodeError extends Error {}

/* ── math ─────────────────────────────────────────────────── */

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const formatDistance = (km) =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;

/* ── opening_hours, enough of it to be useful ────────────── */

const DAY_KEYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAY_ORDER = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Accepts the common OSM forms: "Mo-Sa", "Tu,Th", "Mo-Fr 09:00-17:00". */
function dayMatches(spec, day) {
  const clean = spec.replace(/\b(PH|SH)\b/g, "").trim();
  if (!clean || clean === "Mo-Su") return true;
  const today = DAY_ORDER.indexOf(day);

  return clean.split(",").some(part => {
    const [from, to] = part.trim().split("-").map(s => s.trim());
    const start = DAY_ORDER.indexOf(from);
    if (start === -1) return false;
    if (!to) return start === today;
    const end = DAY_ORDER.indexOf(to);
    if (end === -1) return false;
    return start <= end ? today >= start && today <= end : today >= start || today <= end;
  });
}

function readHours(
  openingHours,
  at = new Date()
) {
  if (!openingHours) return { label: "Not listed", status: "unknown" };
  if (/24\/7/.test(openingHours)) return { label: "Open 24 hours", status: "open" };

  const label = openingHours.replace(/;/g, " · ");
  const segments = openingHours.split(";").map(s => s.trim()).filter(Boolean);
  const todayKey = DAY_KEYS[at.getDay()];
  const nowMinutes = at.getHours() * 60 + at.getMinutes();

  let open = false;
  let closesAt;
  let closingSoon = false;
  let matchedDay = false;

  for (const seg of segments) {
    const times = seg.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g);
    if (!times) continue;
    const daySpec = seg.slice(0, seg.search(/\d{1,2}:\d{2}/)).trim();
    if (!dayMatches(daySpec, todayKey)) continue;
    matchedDay = true;
    for (const raw of times) {
      const m = raw.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (!m) continue;
      const start = +m[1] * 60 + +m[2];
      const end = +m[3] * 60 + +m[4];
      if (nowMinutes >= start && nowMinutes < end) {
        open = true;
        closesAt = `${m[3].padStart(2, "0")}:${m[4]}`;
        closingSoon = end - nowMinutes <= 60;
      }
    }
  }

  if (!matchedDay) return { label, status: "closed", closesAt };
  if (open) return { label, status: closingSoon ? "closing-soon" : "open", closesAt };
  return { label, status: "closed", closesAt };
}

const pretty12h = (hhmm) => {
  if (!hhmm) return undefined;
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

/* ── governance + address from tags ──────────────────────── */

function inferType(tags) {
  const blob = [
    tags.operator,
    tags["operator:gov"],
    tags.ownership,
    tags.governance,
    tags.office,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/government|state govt|govt of|zilla|district|corporat|municipal|nmc|esic|aiims|central/.test(blob))
    return "Government";
  if (/trust|society|charit/.test(blob)) return "Trust";
  if (/private|pvt|ltd|hospital pvt/.test(blob)) return "Private";
  return "Not listed";
}

function buildAddress(tags) {
  const parts = [
    tags["addr:house_number"] ?? tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"] ?? tags["addr:neighbourhood"],
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
    tags["addr:state"],
    tags["addr:postcode"] ?? tags["addr:postal_code"],
  ].filter((v) => Boolean(v && v.trim()));
  return parts.length ? parts.join(", ") : "Address not mapped";
}

function splitList(value) {
  if (!value) return [];
  return [...new Set(
    value
      .split(/[;,]/)
      .map(s => s.trim().replace(/[_-]+/g, " "))
      .filter(s => s.length > 1)
      .map(s => s.replace(/\b\w/g, c => c.toUpperCase()))
)];
}

/* ── resilient networking ────────────────────────────────── */

class StepTimeoutError extends Error {
  constructor(what) {
    super(`${what} did not respond in time.`);
    this.name = "StepTimeoutError";
  }
}

/** fetch with a hard deadline, composable with a page-level AbortController. */
function fetchWithTimeout(
  url,
  init,
  ms,
  external
) {
  return new Promise((resolve, reject) => {
    const ctrl = new AbortController();
    let timedOut = false;
    let settled = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, ms);
    const onExternal = () => ctrl.abort();
    external?.addEventListener("abort", onExternal);
    const cleanup = () => {
      window.clearTimeout(timer);
      external?.removeEventListener("abort", onExternal);
    };
    fetch(url, { ...init, signal: ctrl.signal })
      .then(res => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(res);
      })
      .catch(err => {
        if (settled) return;
        settled = true;
        cleanup();
        if (external?.aborted) {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        } else if (timedOut) {
          reject(new StepTimeoutError("The map request"));
        } else {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
  });
}

/** Resolves with the first attempt that succeeds; rejects only if all fail. */
function firstSuccess(promises) {
  return new Promise((resolve, reject) => {
    let pending = promises.length;
    let settled = false;
    for (const p of promises) {
      p.then(
        v => {
          if (!settled) {
            settled = true;
            resolve(v);
          }
        },
        () => {
          if (settled) return;
          pending -= 1;
          if (pending === 0) reject(new Error("all attempts failed"));
        }
);
    }
  });
}

/* ── Overpass ────────────────────────────────────────────── */

function buildQuery({ lat, lon }, radius) {
  const around = `(around:${radius},${lat},${lon})`;
  return `[out:json][timeout:25];
(
  nwr["amenity"~"^(hospital|clinic|doctors)$"]${around};
  nwr["healthcare"~"^(hospital|clinic|doctor|centre|laboratory)$"]${around};
  nwr["emergency"="yes"]["amenity"="hospital"]${around};
);
out center tags 120;`;
}

async function runOverpass(query, signal) {
  const body = new URLSearchParams({ data: query }).toString();
  const attempts = OVERPASS_ENDPOINTS.map(endpoint =>
    fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body,
      },
      OVERPASS_TIMEOUT_MS,
      signal
).then(res => {
      if (!res.ok) throw new Error(`responded ${res.status}`);
      return res.json();
    }).then(json => (json.elements ?? []))
);
  return firstSuccess(attempts);
}

/**
 * Nominatim fallback for facilities. Overpass mirrors are frequently down or
 * blocked on institutional Wi-Fi; Nominatim answers from the same host that the
 * area search already reached, so if the search box works, hospitals work too.
 */
async function facilitiesViaNominatim(center, radius = 25000) {
  const d = Math.max(0.12, (radius / 1000) * 0.012); // scale box with search radius
  const viewbox = `${center.lon - d},${center.lat + d},${center.lon + d},${center.lat - d}`;
  const url =
    `${NOMINATIM}/search?format=jsonv2&addressdetails=1&extratags=1&limit=45&dedupe=1` +
    `&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent("hospital OR clinic OR health centre")}`;
  const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, GEOCODE_TIMEOUT_MS);
  if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
  const rows = (await res.json());

  const typeMap = { node: "node", way: "way", relation: "relation" };
  return rows
    .filter(r => /hospital|clinic|doctors|health|nursing|medical/i.test(`${r.type} ${r.name} ${r.display_name}`))
    .map(r => {
      const a = r.address ?? {};
      const tags = {
        name: r.name ?? r.display_name?.split(",")[0] ?? "",
        amenity: r.type ?? "hospital",
        "addr:suburb": a.suburb ?? a.neighbourhood ?? "",
        "addr:city": a.city ?? a.town ?? a.village ?? a.county ?? "",
        "addr:state": a.state ?? "",
        "addr:postcode": a.postcode ?? "",
        ...(r.extratags ?? {}),
      };
      return {
        type: typeMap[r.osm_type ?? "node"] ?? "node",
        id: r.osm_id ?? Math.round(Number(r.lat) * 1e6),
        lat: Number(r.lat),
        lon: Number(r.lon),
        tags,
      };
    });
}

/** Overpass first (richest tags), Nominatim as a resilient fallback. */
async function queryFacilities(coords, radius, signal) {
  try {
    const els = await runOverpass(buildQuery(coords, radius), signal);
    if (els.length > 0) return els;
  } catch {
    if (signal?.aborted) throw Object.assign(new Error("aborted"), { name: "AbortError" });
  }
  // Overpass empty, down, or blocked — try the geocoder host instead.
  try {
    return await facilitiesViaNominatim(coords, radius);
  } catch {
    if (signal?.aborted) throw Object.assign(new Error("aborted"), { name: "AbortError" });
    throw new Error(
      "None of the public map servers answered. You may be offline, or the network is blocking " +
      "openstreetmap.org. A phone hotspot usually fixes this."
);
  }
}

function toHospital(el, center) {
  const tags = el.tags ?? {};
  const name = (tags.name ?? tags["name:en"] ?? tags.alt_name ?? "").trim();
  if (!name) return null;

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;

  const km = haversineKm(center, { lat, lon });
  const hours = readHours(tags.opening_hours);

  return {
    id: `${el.type}-${el.id}`,
    osmType: el.type,
    osmId: el.id,
    name,
    type: inferType(tags),
    address: buildAddress(tags),
    lat,
    lon,
    distanceKm: km,
    distanceLabel: formatDistance(km),
    walkMinutes: Math.max(1, Math.round((km / 4.8) * 60)),
    opdStatus: hours.status,
    opdTiming: hours.label,
    closesAt: pretty12h(hours.closesAt),
    specialities: splitList(tags["healthcare:speciality"] ?? tags["medical_speciality"]),
    phone: tags["contact:phone"] ?? tags.phone,
    website: tags.website ?? tags["contact:website"],
    emergency: tags.emergency === "yes" || tags["emergency:ambulance"] === "yes",
    beds: tags.beds,
  };
}

/* ── place lookup: Nominatim → Photon, cached per query ──── */


const placeCache = new Map();
const isNotFound = (e) => e instanceof GeocodeError && e.message.startsWith("No area found");

async function geocodeViaNominatim(query) {
  const res = await fetchWithTimeout(
    `${NOMINATIM}/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } },
    GEOCODE_TIMEOUT_MS
);
  if (res.status === 429) throw new GeocodeError("The place server is busy.");
  if (!res.ok) throw new GeocodeError("The place search failed. Check the spelling and try again.");
  const rows = (await res.json())




;
  if (!rows.length) throw new GeocodeError(`No area found for “${query}”. Try a 6-digit PIN code or the district name.`);
  const row = rows[0];
  const a = row.address ?? {};
  const locality = a.suburb ?? a.city ?? a.town ?? a.village ?? a.state_district;
  return {
    coords: { lat: Number(row.lat), lon: Number(row.lon) },
    place: { label: locality ?? row.display_name.split(",")[0], detail: row.display_name },
  };
}

async function geocodeViaPhoton(query) {
  const res = await fetchWithTimeout(
    `${PHOTON}?q=${encodeURIComponent(query)}&limit=1`,
    { headers: { Accept: "application/json" } },
    GEOCODE_TIMEOUT_MS
);
  if (!res.ok) throw new GeocodeError("The backup place search failed.");
  const data = (await res.json())




;
  const f = data.features?.[0];
  if (!f) throw new GeocodeError(`No area found for “${query}”. Try a 6-digit PIN code or the district name.`);
  const [lon, lat] = f.geometry.coordinates;
  const p = f.properties ?? {};
  return {
    coords: { lat, lon },
    place: {
      label: p.name || p.city || p.state || query,
      detail: [p.name, p.city, p.state, p.postcode].filter(Boolean).join(", "),
    },
  };
}

export async function geocodePlace(query) {
  const key = query.trim().toLowerCase();
  const cached = placeCache.get(key);
  if (cached) return cached;

  let primaryError;
  try {
    const found = await geocodeViaNominatim(query);
    placeCache.set(key, found);
    return found;
  } catch (e) {
    primaryError = e; // 429 / blocked / timed out / not found — the backup gets its shot
  }

  try {
    const found = await geocodeViaPhoton(query);
    placeCache.set(key, found);
    return found;
  } catch (e) {
    if (primaryError instanceof GeocodeError && !isNotFound(primaryError)) {
      if (e instanceof GeocodeError && isNotFound(e)) throw e; // honest not-found
      throw new GeocodeError(
        "Could not reach the place servers. Check your internet connection, or switch to a " +
        "phone hotspot and try again."
);
    }
    throw e;
  }
}

async function reverseGeocode(coords) {
  try {
    const res = await fetchWithTimeout(
      `${NOMINATIM}/reverse?format=jsonv2&zoom=14&lat=${coords.lat}&lon=${coords.lon}`,
      { headers: { Accept: "application/json" } },
      REVERSE_TIMEOUT_MS
);
    if (!res.ok) return null;
    const j = (await res.json())


;
    const a = j.address ?? {};
    const locality =
      a.suburb ?? a.city_district ?? a.neighbourhood ?? a.quarter ?? a.village ?? a.town ?? a.city;
    const region = [a.state_district, a.state].filter(Boolean).join(", ");
    return {
      label: locality ?? region ?? "Current position",
      detail: [locality, region].filter(Boolean).join(", ") || (j.display_name ?? ""),
    };
  } catch {
    return null;
  }
}

/* ── cache ───────────────────────────────────────────────── */



function readCache(coords) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const key = `${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}`;
    if (parsed.coordsKey !== key) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(coords, result) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...result, coordsKey: `${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}` })
);
  } catch {
    /* storage full or blocked — results still live in memory for this session */
  }
}

/* ── main entry ──────────────────────────────────────────── */

export async function fetchFacilities(
  coords,
  signal
) {
  const normCoords = {
    lat: Number(coords?.lat ?? coords?.latitude),
    lon: Number(coords?.lon ?? coords?.longitude ?? coords?.lng),
  };

  if (!Number.isFinite(normCoords.lat) || !Number.isFinite(normCoords.lon)) {
    throw new Error("Invalid coordinates provided.");
  }

  const cached = readCache(normCoords);
  if (cached) return cached;

  // Address and facility query run independently: a Nominatim failure must not
  // cost the patient their hospital list.
  const placePromise = reverseGeocode(normCoords);

  // Progressive radius search: 10 km -> 25 km -> 50 km
  let radius = 10000;
  let widened = false;
  let elements = [];

  try {
    elements = await queryFacilities(normCoords, radius, signal);
  } catch (e) {
    if (signal?.aborted) throw e;
  }

  if (elements.length < 2) {
    radius = 25000;
    widened = true;
    try {
      const more = await queryFacilities(normCoords, radius, signal);
      if (more.length > elements.length) elements = more;
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }

  if (elements.length < 2) {
    radius = 50000;
    widened = true;
    try {
      const more = await queryFacilities(normCoords, radius, signal);
      if (more.length > elements.length) elements = more;
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }

  const seen = new Set();
  const hospitals = elements
    .map(el => toHospital(el, normCoords))
    .filter((h) => {
      if (!h) return false;
      const key = `${h.name.toLowerCase()}|${Math.round(h.lat * 1000)}|${Math.round(h.lon * 1000)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 40);

  const place = await placePromise;

  const result = {
    hospitals,
    center: normCoords,
    place,
    radiusUsed: radius,
    fetchedAt: Date.now(),
    widened,
  };
  writeCache(normCoords, result);
  return result;
}

export function requestDeviceLocation(signal) {
  return new Promise(resolve => {
    if (!("geolocation" in navigator)) {
      resolve({ state: "unsupported" });
      return;
    }
    if (!window.isSecureContext) {
      resolve({
        state: "insecure",
        message:
          "This page is loaded over an insecure connection, so the browser blocks location " +
          "before it can even ask permission. Serve the app over HTTPS, or open it as " +
          "http://localhost on this device, then try again.",
      });
      return;
    }
    let settled = false;
    const finish = (r) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      resolve(r);
    };
    const onAbort = () => finish({ state: "unavailable", message: "Location request was cancelled." });
    signal?.addEventListener("abort", onAbort);

    // Try high accuracy first; if unavailable/timeout, try low accuracy before giving up
    navigator.geolocation.getCurrentPosition(
      pos =>
        finish({
          state: "granted",
          coords: { lat: Number(pos.coords.latitude), lon: Number(pos.coords.longitude) },
          accuracy: Math.round(pos.coords.accuracy ?? 0),
        }),
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          finish({ state: "denied" });
        } else {
          // Retry with low accuracy (faster and works on Wi-Fi without GPS hardware)
          navigator.geolocation.getCurrentPosition(
            pos2 =>
              finish({
                state: "granted",
                coords: { lat: Number(pos2.coords.latitude), lon: Number(pos2.coords.longitude) },
                accuracy: Math.round(pos2.coords.accuracy ?? 0),
              }),
            err2 => {
              if (err2.code === err2.PERMISSION_DENIED) {
                finish({ state: "denied" });
              } else if (err2.code === err2.POSITION_UNAVAILABLE) {
                finish({ state: "unavailable", message: "No GPS fix available. Move near a window or enter your area." });
              } else {
                finish({ state: "unavailable", message: "Timed out while reading your position." });
              }
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

export function openStreetMapLink(h) {
  return `https://www.openstreetmap.org/${h.osmType}/${h.osmId}`;
}

export function directionsLink(h) {
  return `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`;
}

export function clearGeoCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
