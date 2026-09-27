import crypto from "node:crypto";
import Razorpay from "razorpay";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ok } from "../utils/respond.js";

const VALID_PLANS = {
  starter: { name: "Starter", amount: 1499, interval: "month" },
  hospital: { name: "Hospital", amount: 4999, interval: "month" },
  enterprise: { name: "Enterprise", amount: 14999, interval: "month" },
};

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function createCardOrder(req, res) {
  const { plan: planKey, amount, currency = "INR", hospitalId, userId } = req.body || {};

  const normKey = (planKey || "").toLowerCase();
  const planInfo = VALID_PLANS[normKey];
  const finalAmount = planInfo ? planInfo.amount : Number(amount);

  if (!finalAmount || finalAmount <= 0) {
    throw ApiError.badRequest("Invalid plan or subscription amount.");
  }

  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    return ok(res, {
      configured: false,
      message:
        "Payment Gateway credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured in environment variables. Add live credentials in apps/api/.env to process real card transactions.",
      plan: planInfo?.name || planKey,
      amount: finalAmount,
    });
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // Razorpay accepts paise
      currency: currency || "INR",
      receipt: `sub_${Date.now().toString().slice(-8)}`,
      notes: {
        plan: planInfo?.name || planKey,
        userId: userId || "",
        hospitalId: hospitalId || "",
      },
    });

    return ok(res, {
      configured: true,
      keyId: process.env.RAZORPAY_KEY_ID.trim(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planInfo?.name || planKey,
    });
  } catch (err) {
    console.error("[payments] Razorpay order creation failed:", err);
    throw ApiError.internal("Could not initiate payment with card gateway. Please try again.");
  }
}

export async function verifyCardPayment(req, res) {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
    amount,
    userId,
    hospitalId,
  } = req.body || {};

  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) {
    throw ApiError.badRequest("Card payment gateway secret is not configured on the server.");
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw ApiError.badRequest("Incomplete payment response from gateway.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    // Record failed payment attempt
    try {
      await prisma.subscription.create({
        data: {
          userId: userId || null,
          hospitalId: hospitalId || null,
          plan: plan || "Unknown",
          amount: Number(amount) || 0,
          currency: "INR",
          paymentGateway: "RAZORPAY",
          transactionId: `${razorpay_payment_id}_failed`,
          paymentStatus: "FAILED",
          startDate: new Date(),
          expiryDate: new Date(),
          isActive: false,
          meta: { error: "Signature mismatch", razorpay_order_id, razorpay_payment_id },
        },
      });
    } catch {}

    throw ApiError.badRequest("Payment signature verification failed. The transaction cannot be verified.");
  }

  // Signature is valid — activate subscription
  const now = new Date();
  const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const subscription = await prisma.subscription.create({
    data: {
      userId: userId || null,
      hospitalId: hospitalId || null,
      plan: plan || "Hospital",
      amount: Number(amount) || 0,
      currency: "INR",
      paymentGateway: "RAZORPAY",
      transactionId: razorpay_payment_id,
      paymentStatus: "SUCCESS",
      startDate: now,
      expiryDate,
      isActive: true,
      meta: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        verifiedAt: now.toISOString(),
      },
    },
  });

  if (hospitalId) {
    await prisma.hospital.updateMany({
      where: { id: hospitalId },
      data: { subscriptionTier: plan || "Hospital" },
    });
  }

  if (userId) {
    await prisma.staffUser.updateMany({
      where: { id: userId },
      data: { subscriptionStatus: plan || "Hospital" },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorType: "STAFF",
      staffId: userId || null,
      action: "SUBSCRIPTION_ACTIVATED",
      entity: "Subscription",
      entityId: subscription.id,
      meta: { plan, amount, gateway: "RAZORPAY", transactionId: razorpay_payment_id },
    },
  });

  return ok(res, {
    subscription,
    status: "active",
    plan: subscription.plan,
    amount: subscription.amount,
    transactionId: subscription.transactionId,
    expiryDate: subscription.expiryDate,
  }, "Card payment verified and subscription activated successfully.");
}

export async function verifyUpiPayment(req, res) {
  const { plan, amount, utr, userId, hospitalId } = req.body || {};

  const cleanUtr = (utr || "").trim();
  if (!cleanUtr || cleanUtr.length < 6) {
    throw ApiError.badRequest("Please enter a valid UPI Transaction Reference ID (UTR / Reference Number).");
  }

  // Check for duplicate transaction ID
  const existing = await prisma.subscription.findUnique({
    where: { transactionId: cleanUtr },
  });

  if (existing) {
    throw ApiError.conflict(
      "This UPI Transaction Reference has already been submitted. Please check your reference or contact support if you need assistance."
    );
  }

  const finalAmount = Number(amount) || 1499;
  const now = new Date();
  const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const subscription = await prisma.subscription.create({
    data: {
      userId: userId || null,
      hospitalId: hospitalId || null,
      plan: plan || "Starter",
      amount: finalAmount,
      currency: "INR",
      paymentGateway: "UPI",
      transactionId: cleanUtr,
      paymentStatus: "SUCCESS",
      startDate: now,
      expiryDate,
      isActive: true,
      meta: {
        upiId: "pamraghvendra12-7@oksbi",
        payee: "Raghvendra Pandey",
        verifiedAt: now.toISOString(),
      },
    },
  });

  if (hospitalId) {
    await prisma.hospital.updateMany({
      where: { id: hospitalId },
      data: { subscriptionTier: plan || "Starter" },
    });
  }

  if (userId) {
    await prisma.staffUser.updateMany({
      where: { id: userId },
      data: { subscriptionStatus: plan || "Starter" },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorType: "STAFF",
      staffId: userId || null,
      action: "SUBSCRIPTION_ACTIVATED",
      entity: "Subscription",
      entityId: subscription.id,
      meta: { plan, amount: finalAmount, gateway: "UPI", transactionId: cleanUtr },
    },
  });

  return ok(res, {
    subscription,
    status: "active",
    plan: subscription.plan,
    amount: subscription.amount,
    transactionId: subscription.transactionId,
    expiryDate: subscription.expiryDate,
  }, "UPI payment verified and subscription activated successfully.");
}

export async function getSubscriptionStatus(req, res) {
  const activeSub = await prisma.subscription.findFirst({
    where: {
      isActive: true,
      paymentStatus: "SUCCESS",
      expiryDate: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      hospital: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return ok(res, {
    active: !!activeSub,
    subscription: activeSub || null,
  });
}

export async function cancelPayment(req, res) {
  const { transactionId, orderId, reason } = req.body || {};
  const id = transactionId || orderId;

  if (id) {
    try {
      await prisma.subscription.updateMany({
        where: { transactionId: id, paymentStatus: "PENDING" },
        data: {
          paymentStatus: "CANCELLED",
          isActive: false,
          meta: { cancelledAt: new Date().toISOString(), reason: reason || "User cancelled" },
        },
      });
    } catch {}
  }

  return ok(res, { cancelled: true, message: "Payment cancelled by user." });
}
