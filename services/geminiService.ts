
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { TradeType, Urgency } from "../types";

/**
 * Analyses a maintenance ticket description using Gemini AI to suggest a trade, urgency level, and technical advice.
 * Follows Google GenAI SDK best practices for model selection and client initialization.
 */
export const analyzeTicketDescription = async (description: string) => {
  // The API key must be obtained exclusively from the process.env.API_KEY environment variable.
  // Use this process.env.API_KEY string directly when initializing the @google/genai client instance.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      // Using gemini-3-flash-preview for high-performance basic text analysis tasks.
      model: "gemini-3-flash-preview",
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
          },
          propertyOrdering: ["suggestedTrade", "suggestedUrgency", "technicalAdvice"]
        }
      }
    });

    // The result text is accessed via the .text property (not a method call).
    const text = response.text;
    if (!text) {
      throw new Error("No text content returned from Gemini API");
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};
