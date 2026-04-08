import { GoogleGenAI, Modality } from "@google/genai";
import { Message, Level } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing!");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function* generateAIResponseStream(level: Level, history: Message[], currentMessage: string) {
  const model = "gemini-flash-latest";
  
  if (!process.env.GEMINI_API_KEY) {
    yield "Error: Gemini API Key is not configured.";
    return;
  }

  let formattedHistory = history.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const firstUserIndex = formattedHistory.findIndex(m => m.role === 'user');
  if (firstUserIndex !== -1) {
    formattedHistory = formattedHistory.slice(firstUserIndex);
  } else {
    formattedHistory = [];
  }

  const contents = [
    ...formattedHistory,
    {
      role: "user",
      parts: [{ text: currentMessage }]
    }
  ];

  try {
    const response = await ai.models.generateContentStream({
      model,
      contents: contents as any,
      config: {
        systemInstruction: level.instruction,
      }
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error: any) {
    console.error("Gemini Streaming Error:", error);
    const errorMessage = error.message || "";
    if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota")) {
      yield "Error: Rate limit exceeded. Please wait a minute before trying again.";
    } else if (errorMessage.includes("SAFETY")) {
      yield "Error: The response was blocked by safety filters. Please try a different topic.";
    } else {
      yield "I'm having trouble connecting to my brain right now. Please try again in a moment.";
    }
  }
}

export async function generateAIResponse(level: Level, history: Message[], currentMessage: string) {
  const model = "gemini-flash-latest";
  
  if (!process.env.GEMINI_API_KEY) {
    return "Error: Gemini API Key is not configured. Please add it to the Secrets panel in the AI Studio settings.";
  }

  // Filter history to ensure it starts with a 'user' message
  // Gemini requires the first message in a multi-turn conversation to be from the user.
  let formattedHistory = history.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  // Find the first 'user' message index
  const firstUserIndex = formattedHistory.findIndex(m => m.role === 'user');
  if (firstUserIndex !== -1) {
    formattedHistory = formattedHistory.slice(firstUserIndex);
  } else {
    // If no user message in history, start fresh with the current message
    formattedHistory = [];
  }

  const contents = [
    ...formattedHistory,
    {
      role: "user",
      parts: [{ text: currentMessage }]
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents: contents as any,
      config: {
        systemInstruction: level.instruction,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Gemini AI Response Error:", error);
    const errorMessage = error.message || "";
    if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("API key not found") || errorMessage.includes("403")) {
      return "Error: Gemini API Key is missing, invalid, or lacks permissions. Please check your project settings.";
    }
    if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota")) {
      return "Error: Rate limit exceeded (15 requests per minute for free tier). Please wait a moment.";
    }
    if (errorMessage.includes("SAFETY")) {
      return "Error: This conversation was flagged by safety filters. Let's talk about something else!";
    }
    return "I'm having trouble connecting to my brain right now. Please try again in a moment.";
  }
}

export async function generateSpeech(text: string, level: Level, retries = 2) {
  if (!text || text.trim().length === 0) return null;
  if (!process.env.GEMINI_API_KEY) {
    console.error("Speech generation failed: GEMINI_API_KEY is missing!");
    return null;
  }

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
  const model = "gemini-flash-latest";
  if (!process.env.GEMINI_API_KEY) {
    return "Error: Gemini API Key is missing.";
  }
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
