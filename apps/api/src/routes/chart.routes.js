import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { idParam, updateSummarySchema } from "../validators/schemas.js";
import { getChart, updateChartSummary, verifyChart } from "../controllers/chart.controller.js";

/** Patient records — never reachable without an authenticated clinician. */
const router = Router();

router.use(requireAuth, requireRole("DOCTOR", "ADMIN"));

router.get("/:id", validate({ params: idParam }), asyncHandler(getChart));
router.patch("/:id/summary", validate({ params: idParam, body: updateSummarySchema }), asyncHandler(updateChartSummary));
router.post("/:id/verify", validate({ params: idParam }), asyncHandler(verifyChart));

export default router;
