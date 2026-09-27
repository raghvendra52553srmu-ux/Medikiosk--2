import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createCardOrder,
  verifyCardPayment,
  verifyUpiPayment,
  getSubscriptionStatus,
  cancelPayment,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/card/create-order", asyncHandler(createCardOrder));
router.post("/card/verify", asyncHandler(verifyCardPayment));
router.post("/upi/verify", asyncHandler(verifyUpiPayment));
router.get("/status", asyncHandler(getSubscriptionStatus));
router.post("/cancel", asyncHandler(cancelPayment));

export default router;
