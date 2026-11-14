import { GoogleGenAI } from "@google/genai";
import { Expense, User, City } from "../types";

const nodeApiKey =
  typeof process !== "undefined" ? process.env.API_KEY : undefined;
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || nodeApiKey;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getTravelInsights = async (
  expenses: Expense[],
  users: User[],
  cities: City[],
) => {
  if (expenses.length === 0)
    return "Adicione alguns gastos para receber insights da inteligência artificial!";
  if (!ai)
    return "IA desativada: configure GEMINI_API_KEY no .env.local para receber insights.";

  // Fixed: Expense uses userIds (array) instead of userId
  const summary = expenses
    .map((e) => {
      const userNames = users
        .filter((u) => e.userIds.includes(u.id))
        .map((u) => u.name)
        .join(", ");
      const city = cities.find((c) => c.id === e.cityId)?.name;
      return `${userNames} gastou(aram) R$ ${e.convertedAmountBRL.toFixed(2)} em ${city} (${e.category}: ${e.description})`;
    })
    .join("\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise estes gastos de viagem e dê 3 dicas curtas e úteis em português:
      ${summary}
      Foque em economia e equilíbrio entre os viajantes.`,
    });

    // Access .text property (not a method)
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com o assistente de viagem.";
  }
};

export const parseSmartExpense = async (text: string) => {
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extraia informações de gasto do texto: "${text}". 
            Retorne um JSON com: amount (number), currencyCode (string, e.g. USD, EUR, BRL), description (string), category (um de: Alimentação, Transporte, Hospedagem, Lazer, Compras, Outros).`,
      config: {
        responseMimeType: "application/json",
      },
    });
    // Access .text property (not a method)
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
};
