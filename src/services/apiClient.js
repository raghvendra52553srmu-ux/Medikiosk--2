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

const BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");
const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(
      status,
      code,
    message,
      details
) {
    super(message);this.status = status;this.code = code;this.details = details;;
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

  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    window.clearTimeout(timer);
    if (signal?.aborted) throw new ApiError(0, "ABORTED", "Request cancelled.");
    const timedOut = (err)?.name === "AbortError";
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
      throw new ApiError(response.status, "BAD_RESPONSE", "The server sent an unexpected response.");
    }
  }

  const envelope = payload;

  if (!response.ok || envelope?.success === false) {
    const err = envelope?.error;
    throw new ApiError(
      response.status,
      err?.code ?? "UNKNOWN_ERROR",
      err?.message ?? "Something went wrong. Please try again.",
      err?.details
);
  }

  return (envelope?.data ?? null);
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
