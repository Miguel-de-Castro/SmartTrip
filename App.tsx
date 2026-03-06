import React, { useState, useEffect } from "react";
import { User, City, Expense, TripState } from "./types";
import { CURRENCIES, DEFAULT_CATEGORIES } from "./constants";
import { Dashboard } from "./components/Dashboard";
import { Calendar } from "./components/Calendar";
import { ExpenseForm } from "./components/ExpenseForm";
import { Debts } from "./components/Debts";
import { Settings } from "./components/Settings";
import { Header } from "./components/ui/Header";
import initialTripState from "./data/tripState.json";
import { formatBRL } from "./utils/currency";
import { formatDatePtBr } from "./utils/date";

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState<boolean>(() => {
    return localStorage.getItem("vsmart_layout_mode") === "desktop";
  });
  const [activeTab, setActiveTab] = useState<
    "overview" | "calendar" | "expenses" | "division" | "settings"
  >("overview");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [hideValues, setHideValues] = useState(false);

  const [state, setState] = useState<TripState>(() => {
    const parsed = initialTripState as TripState;
    return {
      ...parsed,
      categories:
        parsed.categories && parsed.categories.length > 0
          ? parsed.categories
          : DEFAULT_CATEGORIES,
    };
  });

  const persistTripState = async (nextState: TripState) => {
    try {
      await fetch("/api/trip-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextState),
      });
    } catch (error) {
      console.error("Erro ao salvar tripState.json:", error);
    }
  };

  const applyStateUpdate = (updater: (prev: TripState) => TripState) => {
    setState((prev) => {
      const next = updater(prev);
      void persistTripState(next);
      return next;
    });
  };

  const loadFromJsonDb = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/trip-state", { cache: "no-store" });
      if (!response.ok) return false;
      const json = (await response.json()) as TripState;
      setState({
        ...json,
        categories:
          json.categories && json.categories.length > 0
            ? json.categories
            : DEFAULT_CATEGORIES,
      });
      return true;
    } catch (error) {
      console.error("Erro ao carregar tripState.json:", error);
      return false;
    }
  };

  useEffect(() => {
    void loadFromJsonDb();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem(
      "vsmart_layout_mode",
      isDesktopLayout ? "desktop" : "mobile",
    );
  }, [isDesktopLayout]);

  const handleSaveExpense = (expenseData: any | any[]) => {
    if (Array.isArray(expenseData)) {
      const bulkExpenses: Expense[] = expenseData.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
      }));

      applyStateUpdate((prev) => ({
        ...prev,
        expenses: [...bulkExpenses, ...prev.expenses],
      }));

      closeExpenseForm();
      return;
    }

    if (editingExpense) {
      const updatedExpense: Expense = { ...expenseData, id: editingExpense.id };
      applyStateUpdate((prev) => ({
        ...prev,
        expenses: prev.expenses.map((e) =>
          e.id === editingExpense.id ? updatedExpense : e,
        ),
      }));
    } else {
      const expense: Expense = { ...expenseData, id: crypto.randomUUID() };
      applyStateUpdate((prev) => ({
        ...prev,
        expenses: [expense, ...prev.expenses],
      }));
    }
    closeExpenseForm();
  };

  const deleteExpense = (id: string) => {
    applyStateUpdate((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const openExpenseForm = (expense?: Expense) => {
    if (expense) setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const closeExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  const updateUsers = (users: User[]) =>
    applyStateUpdate((prev) => ({ ...prev, users }));
  const updateCities = (cities: City[]) =>
    applyStateUpdate((prev) => ({ ...prev, cities }));
  const updateBudget = (totalBudgetBRL: number) =>
    applyStateUpdate((prev) => ({ ...prev, totalBudgetBRL }));
  const updateCategories = (categories: TripState["categories"]) =>
    applyStateUpdate((prev) => ({ ...prev, categories }));

  const toggleDebtPaid = (
    expenseId: string,
    debtorUserId: string,
    paid: boolean,
  ) => {
    applyStateUpdate((prev) => ({
      ...prev,
      expenses: prev.expenses.map((expense) => {
        if (expense.id !== expenseId) return expense;

        const settledSet = new Set(expense.settledUserIds || []);
        if (paid) settledSet.add(debtorUserId);
        else settledSet.delete(debtorUserId);

        return {
          ...expense,
          settledUserIds: Array.from(settledSet),
        };
      }),
    }));
  };

  const getHeaderData = () => {
    switch (activeTab) {
      case "overview":
        return { title: "Viajante!", subtitle: "Boa tarde,", profile: true };
      case "calendar":
        return {
          title: "Sua Agenda",
          subtitle: "Cronograma de",
          profile: false,
        };
      case "division":
        return {
          title: "Devendo",
          subtitle: "Quem deve para quem",
          profile: false,
        };
      case "expenses":
        return {
          title: "Lançamentos",
          subtitle: "Histórico de",
          profile: false,
        };
      case "settings":
        return {
          title: "Ajustes",
          subtitle: "Configurações de",
          profile: false,
        };
      default:
        return {
          title: "Ajustes",
          subtitle: "Configurações de",
          profile: false,
        };
    }
  };

  const header = getHeaderData();

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${isDarkMode ? "dark bg-slate-950" : "bg-slate-50"}`}
    >
      <Header
        title={header.title}
        subtitle={header.subtitle}
        isDarkMode={isDarkMode}
        isDesktopLayout={isDesktopLayout}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleDesktopLayout={() => setIsDesktopLayout((prev) => !prev)}
        onOpenSettings={() => setActiveTab("settings")}
        hideValues={activeTab === "overview" ? hideValues : undefined}
        onToggleHideValues={
          activeTab === "overview"
            ? () => setHideValues(!hideValues)
            : undefined
        }
        showProfile={header.profile}
      />

      <main
        className={`mx-auto -mt-16 relative z-20 ${
          isDesktopLayout ? "max-w-[1400px] px-8 pb-24" : "max-w-xl px-4 pb-32"
        }`}
      >
        {activeTab === "overview" && (
          <Dashboard
            expenses={state.expenses}
            users={state.users}
            cities={state.cities}
            categories={state.categories}
            budget={state.totalBudgetBRL}
            hideValues={hideValues}
          />
        )}

        {activeTab === "calendar" && (
          <Calendar
            expenses={state.expenses}
            users={state.users}
            cities={state.cities}
            categories={state.categories}
          />
        )}

        {activeTab === "division" && (
          <Debts
            expenses={state.expenses}
            users={state.users}
            onTogglePaid={toggleDebtPaid}
          />
        )}

        {activeTab === "settings" && (
          <Settings
            state={state}
            onUpdateUsers={updateUsers}
            onUpdateCities={updateCities}
            onUpdateCategories={updateCategories}
            onUpdateBudget={updateBudget}
            onReloadFromJson={loadFromJsonDb}
          />
        )}

        {activeTab === "expenses" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {state.expenses.length > 0 ? (
              state.expenses.map((expense) => {
                const cat =
                  state.categories.find((c) => c.id === expense.category) ||
                  DEFAULT_CATEGORIES.find((c) => c.id === "Outros");
                const currency = CURRENCIES.find(
                  (currencyItem) => currencyItem.code === expense.currencyCode,
                );
                return (
                  <div
                    key={expense.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-3xl card-shadow border border-slate-100 dark:border-white/5 flex items-center gap-4 transition-all hover:scale-[1.01]"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl ${cat?.bg} flex items-center justify-center ${cat?.color} shadow-sm`}
                    >
                      <i className={`fa-solid ${cat?.icon} text-lg`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">
                        {expense.description}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Evento: {formatDatePtBr(expense.date)}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Pagamento:{" "}
                        {formatDatePtBr(expense.paymentDate || expense.date)}
                      </p>
                      {expense.currencyCode !== "BRL" &&
                        expense.exchangeRateToBRL && (
                          <p className="text-[9px] text-brand-500 font-bold uppercase tracking-widest mt-0.5">
                            Câmbio: 1 {expense.currencyCode} = R${" "}
                            {expense.exchangeRateToBRL.toFixed(4)}
                          </p>
                        )}
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        R$ {formatBRL(expense.convertedAmountBRL)}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {currency?.symbol || expense.currencyCode}{" "}
                        {expense.amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {expense.currencyCode}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openExpenseForm(expense)}
                        className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-500 flex items-center justify-center transition-colors hover:bg-brand-100"
                      >
                        <i className="fa-solid fa-pen text-[10px]"></i>
                      </button>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center transition-colors hover:bg-red-100"
                      >
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 opacity-40">
                <i className="fa-solid fa-receipt text-4xl mb-4"></i>
                <p className="text-xs font-black uppercase tracking-widest">
                  Nenhum gasto lançado
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 h-20 px-4 safe-bottom z-50">
        <div
          className={`mx-auto h-full flex items-center justify-between ${
            isDesktopLayout ? "max-w-[1400px] px-4" : "max-w-xl"
          }`}
        >
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === "overview" ? "text-brand-500 scale-110" : "text-slate-400 opacity-60"}`}
          >
            <i className="fa-solid fa-house text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tighter">
              Início
            </span>
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === "expenses" ? "text-brand-500 scale-110" : "text-slate-400 opacity-60"}`}
          >
            <i className="fa-solid fa-receipt text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tighter">
              Gastos
            </span>
          </button>

          <button
            onClick={() => openExpenseForm()}
            className="w-12 h-12 bg-brand-500 text-white rounded-full shadow-lg shadow-brand-500/40 flex items-center justify-center -mt-10 border-4 border-white dark:border-slate-950 active:scale-90 transition-all hover:rotate-90"
          >
            <i className="fa-solid fa-plus text-xl"></i>
          </button>

          <button
            onClick={() => setActiveTab("division")}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === "division" ? "text-brand-500 scale-110" : "text-slate-400 opacity-60"}`}
          >
            <i className="fa-solid fa-users text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tighter">
              Devendo
            </span>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === "calendar" ? "text-brand-500 scale-110" : "text-slate-400 opacity-60"}`}
          >
            <i className="fa-solid fa-calendar-day text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tighter">
              Agenda
            </span>
          </button>
        </div>
      </nav>

      {showExpenseForm && (
        <ExpenseForm
          users={state.users}
          cities={state.cities}
          categories={state.categories}
          onAdd={handleSaveExpense}
          onClose={closeExpenseForm}
          initialData={editingExpense || undefined}
        />
      )}
    </div>
  );
};

export default App;
