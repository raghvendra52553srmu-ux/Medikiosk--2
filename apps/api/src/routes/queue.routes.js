import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { idParam, issueTokenSchema, queueQuerySchema, tokenActionParams } from "../validators/schemas.js";
import { actOnToken, createToken, getToken, listQueue, queueMetrics } from "../controllers/queue.controller.js";

const router = Router();

/* Patient-facing: taking and watching a token needs no login. */
router.post("/tokens", writeLimiter, validate({ body: issueTokenSchema }), asyncHandler(createToken));
router.get("/tokens/:id", validate({ params: idParam }), asyncHandler(getToken));

/* Clinical board: staff only. */
router.get("/queue", requireAuth, validate({ query: queueQuerySchema }), asyncHandler(listQueue));
router.get("/queue/metrics", requireAuth, validate({ query: queueQuerySchema }), asyncHandler(queueMetrics));
router.post(
  "/queue/:id/:action",
  requireAuth,
  requireRole("DOCTOR", "ADMIN"),
  validate({ params: tokenActionParams }),
  asyncHandler(actOnToken)
);

export default router;
