import React, { useState, useEffect, useMemo, useRef } from "react";
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
  const [expenseSearchTerm, setExpenseSearchTerm] = useState("");
  const [expenseCityFilter, setExpenseCityFilter] = useState("all");

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

  // Shown as a banner whenever the trip couldn't be loaded or saved, so a
  // failure is never silent.
  const [storageError, setStorageError] = useState<string | null>(null);

  const persistTripState = async (nextState: TripState) => {
    try {
      const response = await fetch("/api/trip-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextState),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error ?? `HTTP ${response.status}`);
      }
      setStorageError(null);
    } catch (error) {
      console.error("Erro ao salvar tripState.json:", error);
      setStorageError(
        "Não foi possível salvar a última alteração. Ela aparece na tela, mas some ao recarregar a página.",
      );
    }
  };

  // Only save once the saved trip has actually been loaded. If loading failed
  // (e.g. a corrupted data file), the app is showing the bundled demo, and
  // saving it would overwrite the user's real file with demo data.
  const loadedFromDisk = useRef(false);

  const applyStateUpdate = (updater: (prev: TripState) => TripState) => {
    setState((prev) => {
      const next = updater(prev);
      if (loadedFromDisk.current) void persistTripState(next);
      return next;
    });
  };

  const loadFromJsonDb = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/trip-state", { cache: "no-store" });
      if (!response.ok) {
        // e.g. vite preview / a static build, where the data API doesn't exist
        if (response.status !== 404) throw new Error(`HTTP ${response.status}`);
        setStorageError(
          "A API de dados não está disponível aqui (use npm run dev). Alterações não serão salvas.",
        );
        return false;
      }
      const json = (await response.json()) as TripState;
      setState({
        ...json,
        categories:
          json.categories && json.categories.length > 0
            ? json.categories
            : DEFAULT_CATEGORIES,
      });
      loadedFromDisk.current = true;
      return true;
    } catch (error) {
      console.error("Erro ao carregar tripState.json:", error);
      setStorageError(
        "Não foi possível carregar seus dados de data/tripState.local.json (o arquivo pode estar corrompido). Para proteger o arquivo, nenhuma alteração será salva até isso ser resolvido.",
      );
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

  const normalizedExpenseSearchTerm = expenseSearchTerm.trim().toLowerCase();

  const expenseAutocompleteOptions = useMemo(() => {
    return Array.from(
      new Set<string>(
        state.expenses
          .map((expense) => expense.description.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [state.expenses]);

  const expenseCityOptions = useMemo(() => {
    return [...state.cities].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [state.cities]);

  const selectedExpenseCityName =
    state.cities.find((city) => city.id === expenseCityFilter)?.name || "Todas";

  const visibleExpenses = useMemo(() => {
    return state.expenses.filter((expense) => {
      const description = expense.description.toLowerCase();
      const matchesSearch =
        !normalizedExpenseSearchTerm ||
        description.includes(normalizedExpenseSearchTerm);
      const matchesCity =
        expenseCityFilter === "all" || expense.cityId === expenseCityFilter;

      return matchesSearch && matchesCity;
    });
  }, [state.expenses, normalizedExpenseSearchTerm, expenseCityFilter]);

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
        {storageError && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          >
            {storageError}
          </div>
        )}
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
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl card-shadow border border-slate-100 dark:border-white/5">
              <label
                htmlFor="expense-search"
                className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2"
              >
                Buscar gasto
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <i className="fa-solid fa-magnifying-glass text-slate-400 text-xs absolute left-3 top-1/2 -translate-y-1/2"></i>
                  <input
                    id="expense-search"
                    type="search"
                    value={expenseSearchTerm}
                    onChange={(event) =>
                      setExpenseSearchTerm(event.target.value)
                    }
                    list="expense-search-options"
                    placeholder="Digite a descrição do gasto"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 pl-9 pr-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <select
                  value={expenseCityFilter}
                  onChange={(event) => setExpenseCityFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:w-48"
                >
                  <option value="all">Todas as cidades</option>
                  {expenseCityOptions.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {expenseSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setExpenseSearchTerm("")}
                    className="px-3 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <datalist id="expense-search-options">
                {expenseAutocompleteOptions.map((description) => (
                  <option key={description} value={description} />
                ))}
              </datalist>
            </div>

            {state.expenses.length > 0 ? (
              visibleExpenses.map((expense) => {
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

            {state.expenses.length > 0 && visibleExpenses.length === 0 && (
              <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-3xl card-shadow border border-slate-100 dark:border-white/5">
                <i className="fa-solid fa-magnifying-glass text-2xl text-slate-300 mb-3"></i>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Nenhum gasto encontrado para "
                  {expenseSearchTerm.trim() || "*"}" em{" "}
                  {selectedExpenseCityName}
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
