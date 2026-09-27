/**
 * AssemblyAI Speech-to-Text Service
 * API Key: 725148352e8d4e57acc655f894894636
 *
 * Provides highly accurate multilingual transcription (Hindi, English, Bengali, etc.)
 * directly from recorded microphone audio.
 */

export const ASSEMBLYAI_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ASSEMBLYAI_API_KEY) ||
  "725148352e8d4e57acc655f894894636";

export async function transcribeAudioWithAssemblyAI(audioBlob, langCode = "hi") {
  if (!audioBlob || audioBlob.size < 1200) {
    throw new Error("Audio recording is too short. Please speak clearly for at least 1-2 seconds.");
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

  const uploadData = await uploadRes.json();
  const uploadUrl = uploadData?.upload_url;
  if (!uploadUrl) {
    throw new Error("AssemblyAI did not return an upload URL.");
  }

  // 2. Request transcription with automatic language detection and punctuation
  const transcriptPayload = {
    audio_url: uploadUrl,
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

  // 3. Poll for completed transcription (every 600ms, up to 30 attempts)
  const maxAttempts = 35;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 600));

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
