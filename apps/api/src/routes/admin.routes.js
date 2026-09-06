import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { auditQuerySchema } from "../validators/schemas.js";
import { listAudit, listStaff, overview } from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/overview", asyncHandler(overview));
router.get("/staff", asyncHandler(listStaff));
router.get("/audit", validate({ query: auditQuerySchema }), asyncHandler(listAudit));

export default router;
