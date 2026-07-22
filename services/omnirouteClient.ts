
/**
 * Client pour la passerelle IA OmniRoute (endpoint compatible OpenAI).
 * Toutes les requêtes IA de l'application passent par ce gateway au lieu
 * d'appeler un fournisseur (Gemini, OpenAI, ...) directement.
 */

const BASE_URL = process.env.OMNIROUTE_BASE_URL || "http://localhost:20128/v1";
const API_KEY = process.env.OMNIROUTE_API_KEY;

// "auto" laisse OmniRoute choisir le meilleur modèle disponible (routing + fallback).
const DEFAULT_MODEL = "auto";

interface ChatCompletionOptions {
  systemPrompt?: string;
  jsonResponse?: boolean;
}

export const requestChatCompletion = async (
  prompt: string,
  { systemPrompt, jsonResponse = true }: ChatCompletionOptions = {}
): Promise<string> => {
  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    { role: "user", content: prompt }
  ];

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {})
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      ...(jsonResponse ? { response_format: { type: "json_object" } } : {})
    })
  });

  if (!response.ok) {
    throw new Error(`OmniRoute request failed (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OmniRoute");
  }

  return content;
};
