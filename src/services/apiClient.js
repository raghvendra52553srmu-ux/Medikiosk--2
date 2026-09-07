/**
 * The single place the frontend talks to the backend.
 *
 * Responsibilities kept here so no page ever repeats them:
 *   - base URL from env (never hardcoded)
 *   - credentials: "include" so the httpOnly auth cookie rides along
 *   - unwrapping the { success, data, message } envelope
 *   - turning every failure into one typed ApiError with a human message
 *   - a request timeout, because a kiosk on rural 3G must not hang forever
 */

export function getBaseUrl() {
  const custom =
    typeof window !== "undefined"
      ? (window.__MEDIKIOSK_API_URL__ || localStorage.getItem("medikiosk.api_url") || "")
      : "";
  const envUrl = (custom || import.meta?.env?.VITE_API_URL || "").trim();
  if (!envUrl || envUrl === "/api") return "/api";
  const cleaned = envUrl.replace(/\/+$/, "");
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}

const DEFAULT_TIMEOUT_MS = 20_000;
const TOKEN_KEY = "medikiosk_auth_token";

export function getAuthToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
  }

  /** Field-level messages, keyed for direct use by form inputs. */
  get fieldErrors() {
    const out = {};
    for (const d of this.details ?? []) out[d.field] = d.message;
    return out;
  }

  get isOffline() {
    return this.code === "NETWORK_ERROR";
  }
  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }
  get isSessionExpired() {
    return this.code === "SESSION_EXPIRED" || this.status === 410;
  }
}

export async function request(path, options = {}) {
  const { method = "GET", body, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  // Honour a caller's own cancellation (React Query unmount) as well as the timeout.
  signal?.addEventListener("abort", () => controller.abort(), { once: true });

  const token = getAuthToken();
  const headers = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const base = getBaseUrl();
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      credentials: "include",
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    window.clearTimeout(timer);
    if (signal?.aborted) throw new ApiError(0, "ABORTED", "Request cancelled.");
    const timedOut = err?.name === "AbortError";
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      timedOut
        ? "The connection is taking too long. Check the network and try again."
        : "Cannot reach the server. Check the network connection and try again."
    );
  } finally {
    window.clearTimeout(timer);
  }

  // 204 and other empty bodies are legitimate successes.
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      let msg = "The server sent an unexpected response.";
      if (response.status === 404) {
        msg = "The requested API endpoint was not found on the server.";
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        msg = "The server is temporarily unavailable. Please try again in a moment.";
      }
      throw new ApiError(response.status, "BAD_RESPONSE", msg);
    }
  }

  const envelope = payload;

  if (!response.ok || envelope?.success === false) {
    const err = envelope?.error;
    let message = "Something went wrong. Please try again.";
    let code = "UNKNOWN_ERROR";
    let details = undefined;

    if (typeof err === "string") {
      message = err;
    } else if (err && typeof err === "object") {
      message = err.message ?? envelope?.message ?? message;
      code = err.code ?? code;
      details = err.details;
    } else if (envelope?.message) {
      message = envelope.message;
    } else if (response.status === 401) {
      message = "Invalid username/email or password.";
    } else if (response.status === 403) {
      message = "You do not have permission to perform this action.";
    } else if (response.status === 404) {
      message = "API endpoint not found.";
    } else if (response.status >= 500) {
      message = "Server error. Please try again shortly.";
    }

    throw new ApiError(response.status, code, message, details);
  }

  return envelope?.data ?? null;
}

export const api = {
  get: (path, signal) => request(path, { signal }),
  post: (path, body, signal) => request(path, { method: "POST", body, signal }),
  put: (path, body, signal) => request(path, { method: "PUT", body, signal }),
  patch: (path, body, signal) => request(path, { method: "PATCH", body, signal }),
  delete: (path, signal) => request(path, { method: "DELETE", signal }),
};

/** Friendly copy for any thrown value — used by toasts and error states. */
export function errorMessage(err) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
