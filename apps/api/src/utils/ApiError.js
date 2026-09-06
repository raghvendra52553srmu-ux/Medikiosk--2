/**
 * The only way the app signals a failure. Carries an HTTP status and a stable
 * machine-readable code so the frontend can branch without string matching.
 */
export class ApiError extends Error {
  constructor(
      status,
      code,
    message,
      details
) {
    super(message);this.status = status;this.code = code;this.details = details;;
    this.name = "ApiError";
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, details) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }
  static validation(message, details) {
    return new ApiError(422, "VALIDATION_ERROR", message, details);
  }
  static unauthorized(message = "Please sign in to continue.") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "You do not have access to this resource.") {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Not found.") {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static conflict(message, details) {
    return new ApiError(409, "CONFLICT", message, details);
  }
  static tooMany(message = "Too many requests. Please wait a moment.") {
    return new ApiError(429, "RATE_LIMITED", message);
  }
  static internal(message = "Something went wrong on our side.") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}
