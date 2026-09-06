import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { attachRealtime } from "./realtime/io.js";
import { disconnectPrisma, prisma } from "./config/prisma.js";

const app = createApp();
const httpServer = createServer(app);
attachRealtime(httpServer);

async function start() {
  try {
    await prisma.$connect();
  } catch (err) {
    console.error("[boot] Cannot reach the database. Check DATABASE_URL.\n", err);
    process.exit(1);
  }

  httpServer.listen(env.PORT, "0.0.0.0", () => {
    console.log(`[medikiosk-api] listening on :${env.PORT}  (${env.NODE_ENV})`);
    console.log(`[medikiosk-api] CORS origins: ${env.corsOrigins.join(", ")}`);
  });
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
