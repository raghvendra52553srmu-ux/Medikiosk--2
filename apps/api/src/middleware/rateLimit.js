import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

const handler = (req, res, next) => {
  next(ApiError.tooMany("Too many requests. Please wait a moment and try again."));
};

/** Brute-force protection on the only credential endpoint. Generous in dev/demo. */
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: env.isProd ? 15 : 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
});

/** Kiosks are shared devices behind one NAT — generous, but bounded. */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.isProd ? 120 : 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler,
});

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.isProd ? 600 : 5000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler,
});
