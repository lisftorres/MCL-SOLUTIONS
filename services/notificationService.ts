
import { GoogleGenAI, Type } from "@google/genai";
import { Ticket, Club, User } from "../types";

/**
 * Service de notification pour MCL Solutions.
 * Utilise l'IA pour rédiger des communications techniques précises.
 */
export const notificationService = {
  /**
   * Génère un contenu d'e-mail professionnel via Gemini et simule l'envoi.
   */
  sendTicketEmail: async (ticket: Ticket, club: Club | undefined, creator: User | undefined) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Rédige un e-mail de notification de maintenance court et professionnel. 
        Détails du problème : ${ticket.description}. 
        Lieu : ${club?.name} - ${ticket.space}. 
        Urgence : ${ticket.urgency}. 
        Métier concerné : ${ticket.trade}. 
        Déclarant : ${creator?.name}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING, description: "Sujet de l'email" },
              body: { type: Type.STRING, description: "Corps de l'email formaté" },
              recipientRole: { type: Type.STRING, description: "Rôle visé (ex: Technicien Plomberie)" }
            }
          }
        }
      });

      const emailContent = JSON.parse(response.text);
      
      // Simulation d'envoi (Log console pour le développeur)
      console.log("%c [EMAIL SENT] ", "background: #F7CE3E; color: #373F47; font-weight: bold;", {
        to: "maintenance-team@mclsolutions.fr",
        ...emailContent
      });

      return emailContent;
    } catch (error) {
      console.error("Erreur génération email notification:", error);
      return null;
    }
  }
};
