import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { idParam } from "../validators/schemas.js";
import authRoutes from "./auth.routes.js";
import sessionRoutes, { deleteDocument } from "./session.routes.js";
import catalogRoutes from "./catalog.routes.js";
import queueRoutes from "./queue.routes.js";
import chartRoutes from "./chart.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/sessions", sessionRoutes);
router.use("/", catalogRoutes);
router.use("/", queueRoutes);
router.use("/charts", chartRoutes);
router.use("/admin", adminRoutes);

router.delete("/documents/:id", validate({ params: idParam }), asyncHandler(deleteDocument));

export default router;
