export interface User {
  id: string;
  name: string;
  color: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rateToBRL: number;
}

export interface CategoryOption {
  id: string;
  icon: string;
  color: string;
  bg: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currencyCode: string;
  convertedAmountBRL: number;
  exchangeRateToBRL?: number;
  date: string; // Data de início ou data única
  time?: string; // Horário do evento (HH:mm)
  startTime?: string; // Horário de início (HH:mm)
  endTime?: string; // Horário de fim (HH:mm)
  startTimeZoneCountry?: string; // País/Fuso do horário de início
  endTimeZoneCountry?: string; // País/Fuso do horário de fim
  paymentDate?: string; // Data em que o pagamento foi realizado
  endDate?: string; // Opcional: para gastos que cobrem um período
  payerUserId?: string; // Usuário que pagou a despesa
  userIds: string[]; // Alterado para suportar múltiplos usuários
  settledUserIds?: string[]; // Participantes que já pagaram sua parte ao pagador
  cityId: string;
  category: string;
}

export enum ExpenseCategory {
  FOOD = "Alimentação",
  TRANSPORT = "Transporte",
  STAY = "Hospedagem",
  FUN = "Lazer",
  SHOPPING = "Compras",
  OTHER = "Outros",
}

export interface TripState {
  users: User[];
  cities: City[];
  expenses: Expense[];
  categories: CategoryOption[];
  currentCurrency: string;
  totalBudgetBRL: number;
}
