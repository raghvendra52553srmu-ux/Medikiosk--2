import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

const handler = () => {
  throw ApiError.tooMany();
};

/** Brute-force protection on the only credential endpoint. */
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
});

/** Kiosks are shared devices behind one NAT — generous, but bounded. */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler,
});

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler,
});
