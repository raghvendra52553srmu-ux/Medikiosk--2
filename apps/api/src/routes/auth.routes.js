import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import { loginSchema } from "../validators/schemas.js";
import { login, logout, me } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", loginLimiter, validate({ body: loginSchema }), asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(me));

export default router;
