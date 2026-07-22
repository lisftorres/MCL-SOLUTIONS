
import { requestChatCompletion } from "./omnirouteClient";

/**
 * Analyse une description de ticket de maintenance via OmniRoute pour suggérer
 * un métier, un niveau d'urgence et un conseil technique.
 */
export const analyzeTicketDescription = async (description: string) => {
  try {
    const content = await requestChatCompletion(
      `Analyse cette description de problème de maintenance dans une salle de sport : "${description}".
      Détermine le métier du bâtiment concerné (parmi la liste fournie), le niveau d'urgence, et donne un court conseil technique.`,
      {
        systemPrompt: `Tu réponds uniquement avec un objet JSON de la forme :
        {
          "suggestedTrade": string, // Le métier le plus probable parmi : Électricité, Plomberie, Peinture, Ventilation, Serrurerie, etc.
          "suggestedUrgency": "BASSE" | "MOYENNE" | "HAUTE" | "CRITIQUE",
          "technicalAdvice": string // Conseil court pour la gestion du problème avant intervention.
        }`
      }
    );

    return JSON.parse(content);
  } catch (error) {
    console.error("OmniRoute analysis failed:", error);
    return null;
  }
};
