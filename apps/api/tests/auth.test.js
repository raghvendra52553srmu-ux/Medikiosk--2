import { afterAll, describe, expect, it } from "vitest";
import { api, loginAs } from "./helpers.js";
import { prisma } from "../src/config/prisma.js";

afterAll(() => prisma.$disconnect());

describe("authentication", () => {
  it("rejects a wrong password without revealing which field was wrong", async () => {
    const res = await api().post("/api/auth/login").send({ identifier: "doctor", password: "nope" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/username\/email or password/i);
  });

  it("rejects an unknown user with the same message", async () => {
    const res = await api().post("/api/auth/login").send({ identifier: "ghost", password: "nope" });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/username\/email or password/i);
  });

  it("validates the request body", async () => {
    const res = await api().post("/api/auth/login").send({ identifier: "" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("signs in a doctor and sets an httpOnly cookie", async () => {
    const res = await api().post("/api/auth/login").send({ identifier: "doctor", password: "Doctor@123" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("doctor");
    // The password must never come back in any form.
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|Doctor@123/);

    const cookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it("blocks protected routes without a token", async () => {
    for (const path of ["/api/queue", "/api/admin/overview", "/api/charts/anything"]) {
      const res = await api().get(path);
      expect(res.status).toBe(401);
    }
  });

  it("stops a doctor from reaching admin-only routes", async () => {
    const token = await loginAs("doctor", "Doctor@123");
    const res = await api().get("/api/admin/overview").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("rejects a forged token", async () => {
    const res = await api().get("/api/queue").set("Authorization", "Bearer not.a.real.jwt");
    expect(res.status).toBe(401);
  });
});
