/**
 * Groq AI Service for MediKiosk
 * Provides resilient clinical triage, interview analysis, and symptom summarization.
 * Used whenever the backend API is unreachable or during AI-assisted triage.
 */

const GROQ_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GROQ_API_KEY) ||
  (typeof process !== "undefined" && process.env?.GROQ_API_KEY) ||
  "";
const GROQ_MODEL = "openai/gpt-oss-20b";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export async function callGroq(messages, temperature = 0.2) {
  if (!GROQ_API_KEY) {
    return null;
  }
  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("[Groq API] Non-200 response:", res.status, errText);
      return null;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.warn("[Groq API] Network error calling Groq:", err?.message || err);
    return null;
  }
}

/**
 * Perform AI clinical triage on patient complaint
 */
export async function groqTriageAnalysis(name, age, sex, problemText = "") {
  const prompt = `You are MediKiosk AI, an automated clinical triage assistant for hospital OPD.
Analyze this patient:
Name: ${name}
Age: ${age}
Sex: ${sex}
Chief Complaint / Symptoms: ${problemText || "General medical consultation requested"}

Output a JSON object with:
{
  "triageLevel": "Urgent" | "Standard" | "Routine",
  "recommendedDepartment": "General Medicine" | "Cardiology" | "Orthopedics" | "Pediatrics" | "ENT" | "Dermatology",
  "suspectedCondition": "brief summary",
  "redFlags": ["any urgent symptoms or empty array"],
  "clinicalNotes": "1-2 sentence doctor briefing note"
}
ONLY return the JSON object, nothing else.`;

  const reply = await callGroq([
    { role: "system", content: "You are an emergency medical triage evaluator. Return only valid JSON." },
    { role: "user", content: prompt },
  ]);

  if (!reply) {
    return {
      triageLevel: "Standard",
      recommendedDepartment: "General Medicine",
      suspectedCondition: problemText || "General consultation",
      redFlags: [],
      clinicalNotes: "Patient registered at kiosk. Triage level standard.",
    };
  }

  try {
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}

  return {
    triageLevel: "Standard",
    recommendedDepartment: "General Medicine",
    suspectedCondition: problemText || "General consultation",
    redFlags: [],
    clinicalNotes: reply.slice(0, 150),
  };
}

/**
 * Summarize medical interview answers into a concise clinical briefing
 */
export async function groqSummarizeInterview(answers, problemText) {
  const prompt = `Summarize this OPD interview into a structured medical note:
Chief Complaint: ${problemText || "Unspecified"}
Interview Answers: ${JSON.stringify(answers)}

Provide 3 bullet points:
1. Symptoms & Duration
2. Risk factors / Red flags
3. Suggested initial evaluation`;

  return await callGroq([
    { role: "system", content: "You are a hospital OPD physician assistant." },
    { role: "user", content: prompt },
  ]);
}
