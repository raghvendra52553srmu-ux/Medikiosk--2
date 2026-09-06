import { afterAll, describe, expect, it } from "vitest";
import { api, cleanupSessions, createSession, firstDoctorId, loginAs, ownDoctorId } from "./helpers.js";
import { prisma } from "../src/config/prisma.js";

const NAME = "Session Spec Patient";
afterAll(async () => {
  await cleanupSessions([NAME]);
  await prisma.$disconnect();
});

describe("registration", () => {
  it("validates every field and reports them together", async () => {
    const res = await api().post("/api/sessions").send({ name: "Ab", age: 999, sex: "X", mobile: "123", consent: true });
    expect(res.status).toBe(422);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["name", "age", "sex", "mobile"]));
  });

  it("requires consent", async () => {
    const res = await api().post("/api/sessions").send({ name: "Test Patient", age: 30, sex: "F", mobile: "9876500001" });
    expect(res.status).toBe(422);
  });

  it("never stores or returns the raw mobile number", async () => {
    const mobile = "9876512345";
    const res = await api()
      .post("/api/sessions")
      .send({ name: NAME, age: 33, sex: "F", mobile, consent: true });

    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toContain(mobile);

    const row = await prisma.patientSession.findUniqueOrThrow({ where: { id: res.body.data.sessionId } });
    expect(row.mobileHash).not.toContain(mobile);
    expect(row.mobileHash).toHaveLength(64);
    expect(row.mobileLast4).toBe("2345");
  });
});

describe("history interview", () => {
  it("saves answers idempotently so the interview resumes", async () => {
    const sessionId = await createSession({ name: NAME });

    await api().put(`/api/sessions/${sessionId}/answers/q1`).send({ value: "Headache" });
    await api().put(`/api/sessions/${sessionId}/answers/q1`).send({ value: "Severe headache" });

    const res = await api().get(`/api/sessions/${sessionId}/answers`);
    expect(res.body.data.answeredCount).toBe(1);
    expect(res.body.data.answers.q1).toBe("Severe headache");
  });

  it("accepts multi-choice arrays", async () => {
    const sessionId = await createSession({ name: NAME });
    await api().put(`/api/sessions/${sessionId}/answers/q5`).send({ value: ["Fever", "Vomiting"] });

    const res = await api().get(`/api/sessions/${sessionId}/answers`);
    expect(res.body.data.answers.q5).toEqual(["Fever", "Vomiting"]);
  });

  it("rejects an unknown question id", async () => {
    const sessionId = await createSession({ name: NAME });

    // Well-formed but not part of the questionnaire -> 400 from the controller.
    const unknown = await api().put(`/api/sessions/${sessionId}/answers/q99`).send({ value: "x" });
    expect(unknown.status).toBe(400);

    // Malformed id -> rejected by the route validator before any handler runs.
    const malformed = await api().put(`/api/sessions/${sessionId}/answers/drop-table`).send({ value: "x" });
    expect(malformed.status).toBe(422);
  });
});

describe("clinical summary", () => {
  it("raises a high-severity flag for chest pain and explains why", async () => {
    const sessionId = await createSession({ name: NAME, age: 58 });
    await api().put(`/api/sessions/${sessionId}/answers/q1`).send({ value: "Chest pain since this morning" });

    const res = await api().get(`/api/sessions/${sessionId}/summary`);
    expect(res.status).toBe(200);

    const flags = res.body.data.redFlags;
    const chest = flags.find((f) => /chest pain/i.test(f.finding));
    expect(chest).toBeTruthy();
    expect(chest.severity).toBe("high");
    // Every flag must carry a human-readable justification.
    expect(chest.reason.length).toBeGreaterThan(10);
  });

  it("does not invent content when nothing was answered", async () => {
    const sessionId = await createSession({ name: NAME });
    const res = await api().get(`/api/sessions/${sessionId}/summary`);

    expect(res.body.data.chiefComplaint).toMatch(/not stated/i);
    expect(res.body.data.allergies).toContain("No known drug allergy");
  });

  it("blocks submission before a token exists", async () => {
    const sessionId = await createSession({ name: NAME });
    const res = await api().post(`/api/sessions/${sessionId}/submit`);
    expect(res.status).toBe(400);
  });
});

describe("chart access control", () => {
  it("refuses to expose a chart to an unauthenticated caller", async () => {
    const doctorId = await firstDoctorId();
    const sessionId = await createSession({ name: NAME });
    const issued = await api().post("/api/tokens").send({ sessionId, doctorId });

    const res = await api().get(`/api/charts/${issued.body.data.id}`);
    expect(res.status).toBe(401);
  });

  it("serves the chart to the signed-in doctor and records the audit trail", async () => {
    const jwt = await loginAs("doctor", "Doctor@123");
    const doctorId = await ownDoctorId();
    const sessionId = await createSession({ name: NAME });
    await api().put(`/api/sessions/${sessionId}/answers/q1`).send({ value: "Fever for three days" });
    const issued = await api().post("/api/tokens").send({ sessionId, doctorId });

    const res = await api().get(`/api/charts/${issued.body.data.id}`).set("Authorization", `Bearer ${jwt}`);
    expect(res.status).toBe(200);
    expect(res.body.data.patient.name).toBe(NAME);
    expect(res.body.data.summary.chiefComplaint).toMatch(/fever/i);
    expect(res.body.data.audit.length).toBeGreaterThan(0);
  });

  it("signs a chart once and refuses a second signature", async () => {
    const jwt = await loginAs("doctor", "Doctor@123");
    const doctorId = await ownDoctorId();
    const sessionId = await createSession({ name: NAME });
    const issued = await api().post("/api/tokens").send({ sessionId, doctorId });
    const tokenId = issued.body.data.id;

    await api().get(`/api/charts/${tokenId}`).set("Authorization", `Bearer ${jwt}`);

    const first = await api().post(`/api/charts/${tokenId}/verify`).set("Authorization", `Bearer ${jwt}`);
    expect(first.status).toBe(200);
    expect(first.body.data.status).toBe("verified");

    const second = await api().post(`/api/charts/${tokenId}/verify`).set("Authorization", `Bearer ${jwt}`);
    expect(second.status).toBe(409);

    // A signed chart is immutable.
    const edit = await api()
      .patch(`/api/charts/${tokenId}/summary`)
      .set("Authorization", `Bearer ${jwt}`)
      .send({ chiefComplaint: "tampered" });
    expect(edit.status).toBe(409);
  });
});

describe("chart ownership", () => {
  it("stops a doctor opening a chart from another doctor's queue", async () => {
    const jwt = await loginAs("doctor", "Doctor@123");
    const mine = await ownDoctorId();

    const other = await prisma.doctor.findFirstOrThrow({ where: { id: { not: mine }, isAvailable: true } });
    const sessionId = await createSession({ name: NAME });
    const issued = await api().post("/api/tokens").send({ sessionId, doctorId: other.id });

    const res = await api().get(`/api/charts/${issued.body.data.id}`).set("Authorization", `Bearer ${jwt}`);
    expect(res.status).toBe(403);
  });
});

describe("api contract", () => {
  it("wraps every success in { success, data, message }", async () => {
    const res = await api().get("/api/sessions/questions");
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("message");
  });

  it("wraps every failure in { success:false, error:{ code, message } }", async () => {
    const res = await api().get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty("code");
    expect(res.body.error).toHaveProperty("message");
  });
});
