/**
 * AssemblyAI Speech-to-Text Service
 * API Key: 725148352e8d4e57acc655f894894636
 *
 * Provides highly accurate multilingual transcription (Hindi, English, etc.)
 * directly from recorded microphone audio.
 */

export const ASSEMBLYAI_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ASSEMBLYAI_API_KEY) ||
  "725148352e8d4e57acc655f894894636";

export async function transcribeAudioWithAssemblyAI(audioBlob, langCode = "hi") {
  if (!audioBlob || audioBlob.size < 1000) {
    throw new Error("Audio recording is too short for transcription.");
  }

  // 1. Upload audio to AssemblyAI
  const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: {
      Authorization: ASSEMBLYAI_API_KEY,
    },
    body: audioBlob,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`AssemblyAI upload failed (${uploadRes.status}): ${errText}`);
  }

  const { upload_url } = await uploadRes.json();
  if (!upload_url) {
    throw new Error("AssemblyAI did not return an upload URL.");
  }

  // 2. Request transcription with automatic language detection and punctuation
  const transcriptPayload = {
    audio_url,
    language_detection: true,
    punctuate: true,
    format_text: true,
  };

  const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      Authorization: ASSEMBLYAI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transcriptPayload),
  });

  if (!transcriptRes.ok) {
    const errText = await transcriptRes.text();
    throw new Error(`AssemblyAI transcription request failed: ${errText}`);
  }

  const { id: transcriptId } = await transcriptRes.json();
  if (!transcriptId) {
    throw new Error("AssemblyAI did not return a transcript ID.");
  }

  // 3. Poll for completed transcription
  const maxAttempts = 35; // ~28 seconds maximum polling
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        Authorization: ASSEMBLYAI_API_KEY,
      },
    });

    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();
    if (pollData.status === "completed") {
      const text = (pollData.text || "").trim();
      return text;
    }
    if (pollData.status === "error") {
      throw new Error(pollData.error || "AssemblyAI transcription error.");
    }
  }

  throw new Error("AssemblyAI transcription timed out.");
}
