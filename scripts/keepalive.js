/**
 * MediKiosk Keep-Alive Daemon
 * Pings the live Render deployment every 5 minutes to keep it warm and 100% awake 24/7.
 */

const TARGET_URL = "https://medikiosk-2.onrender.com/health";
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function ping() {
  const timestamp = new Date().toLocaleTimeString();
  try {
    const res = await fetch(TARGET_URL);
    if (res.ok) {
      console.log(`[${timestamp}] [KeepAlive] Ping successful! Server is awake. (HTTP ${res.status})`);
    } else {
      console.warn(`[${timestamp}] [KeepAlive] Server returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`[${timestamp}] [KeepAlive] Ping error:`, err?.message || err);
  }
}

console.log(`[KeepAlive] Starting MediKiosk 24/7 keep-alive monitor for ${TARGET_URL}...`);
// Immediate initial ping
void ping();

// Recurring ping every 5 minutes
setInterval(ping, INTERVAL_MS);
