import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { attachRealtime } from "./realtime/io.js";
import { disconnectPrisma, prisma } from "./config/prisma.js";

const app = createApp();
const httpServer = createServer(app);
attachRealtime(httpServer);

async function connectWithRetry(retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log("[boot] Database connected successfully.");
      return true;
    } catch (err) {
      console.warn(`[boot] Database connection attempt ${attempt}/${retries} failed: ${err?.message || err}`);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  console.error("[boot] Database connection could not be established after retries. API will return 503 until DB is reachable.");
  return false;
}

async function start() {
  httpServer.listen(env.PORT, () => {
    console.log(`[medikiosk-api] listening on :${env.PORT}  (${env.NODE_ENV})`);
    console.log(`[medikiosk-api] CORS origins: ${env.corsOrigins.join(", ")}`);
  });

  // Connect database in background without blocking server port or crashing on cold-start
  void connectWithRetry();

  // Self-ping keepalive: prevent Render free tier from sleeping after 15 min inactivity
  if (env.isProd) {
    const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || "https://medikiosk-2.onrender.com";
    const ping = async () => {
      try {
        const res = await fetch(`${keepAliveUrl}/health`);
        console.log(`[keepalive] Heartbeat ping to ${keepAliveUrl}/health -> ${res.status}`);
      } catch (err) {
        console.warn(`[keepalive] Ping failed: ${err?.message || err}`);
      }
    };
    setTimeout(ping, 30_000).unref();
    setInterval(ping, 5 * 60 * 1000).unref();
  }
}

/** Finish in-flight requests before dying so a deploy never truncates a write. */
function shutdown(signal) {
  console.log(`[medikiosk-api] ${signal} received, shutting down…`);
  httpServer.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (r) => console.error("[unhandledRejection]", r));

void start();
