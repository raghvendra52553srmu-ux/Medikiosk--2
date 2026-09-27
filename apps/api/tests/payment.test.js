import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Payment & Subscription API", () => {
  it("rejects UPI verification without UTR", async () => {
    const res = await request(app)
      .post("/api/payments/upi/verify")
      .send({ plan: "Starter", amount: 1499 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("verifies UPI payment with valid UTR and activates subscription", async () => {
    const uniqueUtr = `TEST_UTR_${Date.now()}`;
    const res = await request(app)
      .post("/api/payments/upi/verify")
      .send({
        plan: "Starter",
        amount: 1499,
        utr: uniqueUtr,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("active");
    expect(res.body.data.plan).toBe("Starter");
    expect(res.body.data.transactionId).toBe(uniqueUtr);
  });

  it("rejects duplicate UPI transaction reference", async () => {
    const uniqueUtr = `TEST_DUP_${Date.now()}`;
    const first = await request(app)
      .post("/api/payments/upi/verify")
      .send({ plan: "Hospital", amount: 4999, utr: uniqueUtr });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/payments/upi/verify")
      .send({ plan: "Hospital", amount: 4999, utr: uniqueUtr });
    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
  });

  it("indicates gateway configuration requirement for card orders when credentials are not configured", async () => {
    const res = await request(app)
      .post("/api/payments/card/create-order")
      .send({ plan: "Starter", amount: 1499 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // When RAZORPAY_KEY_ID is not configured in test env, configured is false
    if (!process.env.RAZORPAY_KEY_ID) {
      expect(res.body.data.configured).toBe(false);
      expect(res.body.data.message).toContain("RAZORPAY_KEY_ID");
    }
  });

  it("returns active subscription status", async () => {
    const res = await request(app).get("/api/payments/status");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.active).toBe("boolean");
  });
});
