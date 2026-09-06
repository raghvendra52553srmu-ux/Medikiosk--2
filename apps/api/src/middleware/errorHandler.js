import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

/** 404 for anything that fell through the router. */
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

/**
 * The single exit point for every failure.
 * A raw stack trace or a Prisma message never reaches the client.
 */
export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong on our side. Please try again.";
  let details;

  if (err instanceof ApiError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 422;
    code = "VALIDATION_ERROR";
    message = "Please check the highlighted fields.";
    details = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Translate DB constraints into user-safe language.
    switch (err.code) {
      case "P2002":
        status = 409;
        code = "DUPLICATE";
        message = "That record already exists.";
        break;
      case "P2025":
        status = 404;
        code = "NOT_FOUND";
        message = "The requested record no longer exists.";
        break;
      case "P2003":
        status = 409;
        code = "REFERENCE_ERROR";
        message = "That action conflicts with related records.";
        break;
      default:
        status = 400;
        code = "DATABASE_ERROR";
        message = "The request could not be completed.";
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    status = 503;
    code = "DATABASE_UNAVAILABLE";
    message = "The service is temporarily unavailable. Please try again shortly.";
  }

  // Always log the real thing server-side.
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error("[error]", err);
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      // Stack only outside production, and only for genuine 500s.
      ...(!env.isProd && status >= 500 && err instanceof Error ? { stack: err.stack } : {}),
    },
  });
}
