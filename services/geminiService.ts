import { GoogleGenAI, Type } from "@google/genai";
import { TradeType, Urgency } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// We handle the case where it might be missing to prevent app crash on load.
const apiKey = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize Google GenAI:", error);
  }
} else {
  console.warn("Gemini API Key is missing in environment variables.");
}

export const analyzeTicketDescription = async (description: string) => {
  if (!ai) {
    console.error("Gemini AI is not initialized. Check your API_KEY.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyse cette description de problème de maintenance dans une salle de sport : "${description}".
      Détermine le métier du bâtiment concerné (parmi la liste fournie), le niveau d'urgence, et donne un court conseil technique.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTrade: {
              type: Type.STRING,
              description: "Le métier le plus probable parmi : Électricité, Plomberie, Peinture, Ventilation, Serrurerie, etc."
            },
            suggestedUrgency: {
              type: Type.STRING,
              enum: ["BASSE", "MOYENNE", "HAUTE", "CRITIQUE"],
              description: "Niveau d'urgence estimé"
            },
            technicalAdvice: {
              type: Type.STRING,
              description: "Conseil court pour la gestion du problème avant intervention."
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return null;
  }
};