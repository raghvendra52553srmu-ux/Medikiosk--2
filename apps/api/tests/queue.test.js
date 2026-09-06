import { afterAll, describe, expect, it } from "vitest";
import { api, cleanupSessions, createSession, firstDoctorId, loginAs, uniqueMobile } from "./helpers.js";
import { prisma } from "../src/config/prisma.js";

const NAME = "Queue Spec Patient";
afterAll(async () => {
  await cleanupSessions([NAME, "Race Spec"]);
  await prisma.$disconnect();
});

describe("token issuing", () => {
  it("issues a token and puts the patient on the board", async () => {
    const doctorId = await firstDoctorId();
    const sessionId = await createSession({ name: NAME });

    const res = await api().post("/api/tokens").send({ sessionId, doctorId });
    expect(res.status).toBe(201);
    expect(res.body.data.number).toMatch(/^[A-Z]-\d+$/);
    expect(res.body.data.patientName).toBe(NAME);
  });

  it("is idempotent — one visit never gets two tokens", async () => {
    const doctorId = await firstDoctorId();
    const sessionId = await createSession({ name: NAME });

    const a = await api().post("/api/tokens").send({ sessionId, doctorId });
    const b = await api().post("/api/tokens").send({ sessionId, doctorId });

    expect(a.body.data.id).toBe(b.body.data.id);
    expect(b.status).toBe(200);
  });

  it("never issues the same number twice under concurrency", async () => {
    const doctorId = await firstDoctorId();

    const sessionIds = await Promise.all(
      Array.from({ length: 12 }, () =>
        api()
          .post("/api/sessions")
          .send({ name: "Race Spec", age: 30, sex: "M", mobile: uniqueMobile(), consent: true })
          .then(r => r.body.data.sessionId)
)
);

    // Fire them all at once — this is the bug the old hardcoded "A-127" had.
    const results = await Promise.all(
      sessionIds.map(sessionId => api().post("/api/tokens").send({ sessionId, doctorId }))
);

    const numbers = results.map(r => r.body?.data?.number).filter(Boolean);
    expect(numbers).toHaveLength(12);
    expect(new Set(numbers).size).toBe(12);
  });

  it("refuses a token for an unknown session", async () => {
    const doctorId = await firstDoctorId();
    const res = await api().post("/api/tokens").send({ sessionId: "does-not-exist", doctorId });
    expect(res.status).toBe(404);
  });
});

describe("queue state machine", () => {
  it("walks call -> start -> complete and rejects illegal moves", async () => {
    const token = await loginAs("doctor", "Doctor@123");
    const doctorId = await firstDoctorId();
    const sessionId = await createSession({ name: NAME });
    const issued = await api().post("/api/tokens").send({ sessionId, doctorId });
    const tokenId = issued.body.data.id;

    const auth = (p) => api().post(p).set("Authorization", `Bearer ${token}`);

    expect((await auth(`/api/queue/${tokenId}/call`)).status).toBe(200);
    expect((await auth(`/api/queue/${tokenId}/start`)).status).toBe(200);
    expect((await auth(`/api/queue/${tokenId}/complete`)).status).toBe(200);

    // Completing twice is a conflict, not a silent no-op.
    const again = await auth(`/api/queue/${tokenId}/complete`);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("CONFLICT");
  });

  it("rejects an unknown action", async () => {
    const token = await loginAs("doctor", "Doctor@123");
    const res = await api().post("/api/queue/xyz/teleport").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(422);
  });
});
