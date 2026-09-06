import { api, ApiError } from "@/services/apiClient";

/**
 * Staff authentication.
 *
 * The prototype shipped plaintext credentials inside the JS bundle and gated
 * access on a boolean in localStorage — anyone could type
 * `localStorage.setItem('medikiosk.auth.v1','{"doctor":true}')` and open a
 * patient's clinical record.
 *
 * Now: bcrypt-hashed passwords in Postgres, an httpOnly JWT cookie the page's
 * JavaScript cannot read, rate-limited login, and server-side role checks on
 * every protected endpoint. Nothing in this file can grant access on its own.
 */













export const STAFF_LABELS = {
  doctor: {
    title: "Doctor station",
    who: "Clinical Workstation",
    hint: "Sign in with your username or email to open the clinical queue.",
  },
  admin: {
    title: "Hospital operations",
    who: "Administration",
    hint: "Sign in to access the operations dashboard. Not for patients.",
  },
};



export async function loginStaff(
  role,
  identifier,
  password
) {
  try {
    const data = await api.post("/auth/login", { identifier, password });

    // The server authenticates; the client additionally checks the account is
    // the right kind for the door being opened.
    if (data.user.role !== role) {
      await logoutStaff();
      return {
        ok: false,
        message: `Those credentials are for the ${data.user.role} station, not this one.`,
      };
    }
    return { ok: true, user: data.user };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, message: err.message };
    return { ok: false, message: "Cannot reach the server. Check the network and try again." };
  }
}

export async function logoutStaff() {
  try {
    await api.post("/auth/logout");
  } catch {
    /* logging out must always succeed locally */
  }
}

/**
 * Restores the signed-in user on reload. Returns null when the cookie is absent
 * or expired — the caller then shows the sign-in screen.
 */
export async function currentStaff() {
  try {
    return await api.get("/auth/me");
  } catch {
    return null;
  }
}

export function requiresAuth(role) {
  return role === "doctor" || role === "admin";
}
