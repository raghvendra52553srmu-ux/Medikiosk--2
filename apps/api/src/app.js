import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import { ApiError } from "./utils/ApiError.js";

/** localhost, any private-range IP, or a known dev tunnel host. */
function isLocalOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^169\.254\./.test(hostname) ||
      /\.(e2b\.app|ngrok(-free)?\.app|github\.dev|gitpod\.io)$/.test(hostname)
);
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();

  // Behind a proxy (Render/Railway/Fly) so rate-limit sees the real client IP.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, cb) {
        // Same-origin requests, curl and server-to-server have no Origin header.
        if (!origin) return cb(null, true);
        if (env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) return cb(null, true);

        // In development the app is reached over an assortment of hosts —
        // localhost, 127.0.0.1, the LAN IP of a demo laptop, or a preview
        // tunnel. Allowlisting each by hand is friction with no security value
        // on a dev machine; production still honours CORS_ORIGIN exactly.
        if (!env.isProd && isLocalOrigin(origin)) return cb(null, true);

        cb(new ApiError(403, "CORS_REJECTED", "This origin is not allowed to call the API."));
      },
      credentials: true,
    })
);

  // Base64 thumbnails make bodies larger than the 100kb default.
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(globalLimiter);

  app.get("/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ success: true, data: { status: "ok", db: "up", at: new Date().toISOString() }, message: "Healthy." });
    } catch {
      res.status(503).json({ success: false, error: { code: "DATABASE_UNAVAILABLE", message: "Database unreachable." } });
    }
  });

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
