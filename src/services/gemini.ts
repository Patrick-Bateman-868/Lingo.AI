import { GoogleGenAI, Modality } from "@google/genai";
import { Message, Level } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing!");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function generateAIResponse(level: Level, history: Message[], currentMessage: string) {
  const model = "gemini-3-flash-preview";
  
  const contents = [
    ...history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    })),
    {
      role: "user",
      parts: [{ text: currentMessage }]
    }
  ];

  const response = await ai.models.generateContent({
    model,
    contents: contents as any,
    config: {
      systemInstruction: level.instruction,
    }
  });

  return response.text || "I'm sorry, I couldn't generate a response.";
}

export async function generateSpeech(text: string, level: Level, retries = 2) {
  if (!text || text.trim().length === 0) return null;

  // Sanitize text: remove markdown and extra whitespace
  const sanitizedText = text
    .replace(/[*_#`~>]/g, '') // Remove basic markdown
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
    .trim();

  if (sanitizedText.length === 0) return null;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: sanitizedText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: level.voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return base64Audio;
      }
    } catch (error: any) {
      console.error(`Speech generation attempt ${i + 1} failed:`, error);
      if (i === retries) break;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

export async function translatePhrase(phrase: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Translate the following English word or idiom into Russian. Provide a brief explanation if it's an idiom. 
  Format: "Translation: [translation] \n Explanation: [explanation if needed]"
  Phrase: "${phrase}"`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text || "Translation unavailable.";
  } catch (error) {
    console.error("Translation failed:", error);
    return "Error fetching translation.";
  }
}
