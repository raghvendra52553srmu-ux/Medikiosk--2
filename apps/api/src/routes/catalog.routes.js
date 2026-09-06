import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { doctorsQuerySchema, idParam, syncHospitalSchema } from "../validators/schemas.js";
import { getDoctor, listDepartments, listDoctors, syncHospital } from "../controllers/catalog.controller.js";

const router = Router();

router.post("/hospitals/sync", writeLimiter, validate({ body: syncHospitalSchema }), asyncHandler(syncHospital));
router.get("/departments", validate({ query: doctorsQuerySchema }), asyncHandler(listDepartments));
router.get("/doctors", validate({ query: doctorsQuerySchema }), asyncHandler(listDoctors));
router.get("/doctors/:id", validate({ params: idParam }), asyncHandler(getDoctor));

export default router;
