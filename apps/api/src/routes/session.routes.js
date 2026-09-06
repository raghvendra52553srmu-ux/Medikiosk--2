import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import {
  answerParams,
  answerSchema,
  createDocumentSchema,
  createSessionSchema,
  idParam,
  updateSessionSchema,
} from "../validators/schemas.js";
import {
  addDocument,
  createSession,
  deleteDocument,
  getAnswers,
  getSession,
  getSummary,
  listDocuments,
  listQuestions,
  saveAnswer,
  submitSession,
  updateSession,
} from "../controllers/session.controller.js";

/**
 * Public kiosk surface — intentionally unauthenticated. A patient at a village
 * terminal cannot be asked to create a password; the opaque session id is the
 * bearer, it expires, and it grants access to that visit only.
 */
const router = Router();

router.get("/questions", asyncHandler(listQuestions));

router.post("/", writeLimiter, validate({ body: createSessionSchema }), asyncHandler(createSession));
router.get("/:id", validate({ params: idParam }), asyncHandler(getSession));
router.patch("/:id", writeLimiter, validate({ params: idParam, body: updateSessionSchema }), asyncHandler(updateSession));

router.get("/:id/answers", validate({ params: idParam }), asyncHandler(getAnswers));
router.put("/:id/answers/:questionId", writeLimiter, validate({ params: answerParams, body: answerSchema }), asyncHandler(saveAnswer));

router.get("/:id/documents", validate({ params: idParam }), asyncHandler(listDocuments));
router.post("/:id/documents", writeLimiter, validate({ params: idParam, body: createDocumentSchema }), asyncHandler(addDocument));

router.get("/:id/summary", validate({ params: idParam }), asyncHandler(getSummary));
router.post("/:id/submit", writeLimiter, validate({ params: idParam }), asyncHandler(submitSession));

export default router;
export { deleteDocument };
