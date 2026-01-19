
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

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currencyCode: string;
  convertedAmountBRL: number;
  date: string; // Data de início ou data única
  endDate?: string; // Opcional: para gastos que cobrem um período
  userIds: string[]; // Alterado para suportar múltiplos usuários
  cityId: string;
  category: ExpenseCategory;
}

export enum ExpenseCategory {
  FOOD = 'Alimentação',
  TRANSPORT = 'Transporte',
  STAY = 'Hospedagem',
  FUN = 'Lazer',
  SHOPPING = 'Compras',
  OTHER = 'Outros'
}

export interface TripState {
  users: User[];
  cities: City[];
  expenses: Expense[];
  currentCurrency: string;
  totalBudgetBRL: number;
}
