import { CategoryOption, Currency } from "./types";

export const CURRENCIES: Currency[] = [
  { code: "BRL", name: "Real Brasileiro", symbol: "R$", rateToBRL: 1 },
  { code: "USD", name: "Dólar Americano", symbol: "$", rateToBRL: 5.45 },
  { code: "EUR", name: "Euro", symbol: "€", rateToBRL: 5.95 },
  { code: "GBP", name: "Libra Esterlina", symbol: "£", rateToBRL: 7.1 },
  { code: "ARS", name: "Peso Argentino", symbol: "$", rateToBRL: 0.0058 },
];

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  {
    id: "Alimentação",
    icon: "fa-utensils",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    id: "Transporte",
    icon: "fa-car",
    color: "text-brand-500",
    bg: "bg-brand-500/10",
  },
  {
    id: "Trem",
    icon: "fa-train",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    id: "Hospedagem",
    icon: "fa-hotel",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "Lazer",
    icon: "fa-ticket",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    id: "Compras",
    icon: "fa-bag-shopping",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    id: "Outros",
    icon: "fa-ellipsis",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
  },
];

export const USER_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#ec4899", // Pink
];
