import React, { useMemo, useState } from "react";
import { Expense, User, City, CategoryOption } from "../types";
import { formatBRL } from "../utils/currency";
import { CURRENCIES } from "../constants";

interface DashboardProps {
  expenses: Expense[];
  users: User[];
  cities: City[];
  categories: CategoryOption[];
  budget: number;
  hideValues: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  expenses,
  users,
  cities,
  categories,
  budget,
  hideValues,
}) => {
  const [breakdownMode, setBreakdownMode] = useState<
    "category" | "city" | "traveler"
  >("city");
  const [selectedTravelerId, setSelectedTravelerId] = useState<string>("all");

  const totalBRL = useMemo(
    () => expenses.reduce((acc, curr) => acc + curr.convertedAmountBRL, 0),
    [expenses],
  );
  const budgetProgress = Math.min((totalBRL / budget) * 100, 100);

  const userData = useMemo(() => {
    return users.map((user) => {
      const value = expenses.reduce((acc, curr) => {
        if (curr.userIds.includes(user.id)) {
          return acc + curr.convertedAmountBRL / curr.userIds.length;
        }
        return acc;
      }, 0);
      return { ...user, value };
    });
  }, [expenses, users]);

  const cityTotals = useMemo(() => {
    return cities
      .map((city) => {
        const total = expenses
          .filter((expense) => expense.cityId === city.id)
          .reduce((sum, expense) => sum + expense.convertedAmountBRL, 0);

        return { ...city, total };
      })
      .filter((city) => city.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [expenses, cities]);

  const categoryTotals = useMemo(() => {
    return categories
      .map((category) => {
        const total = expenses
          .filter((expense) => expense.category === category.id)
          .reduce((sum, expense) => sum + expense.convertedAmountBRL, 0);

        return { ...category, total };
      })
      .filter((category) => category.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [expenses, categories]);

  const travelerBreakdown = useMemo(() => {
    return users
      .map((user) => {
        const items = expenses
          .filter((expense) => expense.userIds.includes(user.id))
          .map((expense) => {
            const shareValue =
              expense.convertedAmountBRL / expense.userIds.length;
            const cityName =
              cities.find((city) => city.id === expense.cityId)?.name ||
              "Cidade";

            return {
              id: expense.id,
              description: expense.description,
              cityName,
              shareValue,
              shareOriginalAmount: expense.amount / expense.userIds.length,
              currencyCode: expense.currencyCode,
              currencySymbol:
                CURRENCIES.find(
                  (currency) => currency.code === expense.currencyCode,
                )?.symbol || expense.currencyCode,
            };
          })
          .sort((a, b) => b.shareValue - a.shareValue);

        const total = items.reduce((sum, item) => sum + item.shareValue, 0);

        return {
          user,
          items,
          total,
        };
      })
      .filter((entry) => entry.items.length > 0)
      .sort((a, b) => b.total - a.total);
  }, [users, expenses, cities]);

  const visibleTravelerBreakdown = useMemo(() => {
    if (selectedTravelerId === "all") return travelerBreakdown;

    return travelerBreakdown.filter(
      (entry) => entry.user.id === selectedTravelerId,
    );
  }, [travelerBreakdown, selectedTravelerId]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-6">
      {/* Saldo Geral Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5 xl:h-full">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Total Consumido
          </p>
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
          {hideValues ? "R$ ••••••" : `R$ ${formatBRL(totalBRL)}`}
        </h2>

        <div className="mt-10 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Limite de Orçamento
            </span>
            <span className="text-[11px] font-black text-brand-500 uppercase">
              {budgetProgress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,200,110,0.3)]"
              style={{ width: `${budgetProgress}%` }}
            ></div>
          </div>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">
            Meta de Gastos: R$ {formatBRL(budget)}
          </p>
        </div>
      </div>

      {/* Participações por Pessoa */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5 xl:h-full">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">
          Meus Saldos
        </h3>
        <div className="space-y-6">
          {userData.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-[10px] font-black shadow-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-white leading-none mb-1.5">
                    {user.name}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    Conta Individual
                  </p>
                </div>
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                {hideValues ? "R$ ••••" : `R$ ${formatBRL(user.value)}`}
              </p>
            </div>
          ))}
        </div>

        <button className="w-full mt-10 py-4 bg-slate-50 dark:bg-slate-800/50 text-brand-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-3xl hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all border border-transparent hover:border-brand-500/20">
          Ajustar Saldos
        </button>
      </div>

      {/* Gastos por Cidade/Categoria */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5 xl:col-span-2">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {breakdownMode === "city"
              ? "Gastos por Cidade"
              : breakdownMode === "category"
                ? "Gastos por Categoria"
                : "Gastos por Viajante"}
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/10 p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setBreakdownMode("category")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                breakdownMode === "category"
                  ? "bg-brand-500 text-white"
                  : "text-slate-500 dark:text-slate-300"
              }`}
            >
              Categoria
            </button>
            <button
              type="button"
              onClick={() => setBreakdownMode("city")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                breakdownMode === "city"
                  ? "bg-brand-500 text-white"
                  : "text-slate-500 dark:text-slate-300"
              }`}
            >
              Cidade
            </button>
            <button
              type="button"
              onClick={() => setBreakdownMode("traveler")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                breakdownMode === "traveler"
                  ? "bg-brand-500 text-white"
                  : "text-slate-500 dark:text-slate-300"
              }`}
            >
              Viajante
            </button>
          </div>
        </div>

        {breakdownMode === "city" && cityTotals.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {cityTotals.map((city) => (
              <div
                key={city.id}
                className="p-5 rounded-[1.5rem] bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-3">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">
                  {city.name}
                </p>
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 truncate">
                  {city.country}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  R$ {formatBRL(city.total)}
                </p>
              </div>
            ))}
          </div>
        ) : breakdownMode === "category" && categoryTotals.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {categoryTotals.map((category) => (
              <div
                key={category.id}
                className="p-5 rounded-[1.5rem] bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${category.bg} ${category.color} flex items-center justify-center mb-3`}
                >
                  <i className={`fa-solid ${category.icon}`}></i>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">
                  {category.id}
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  R$ {formatBRL(category.total)}
                </p>
              </div>
            ))}
          </div>
        ) : breakdownMode === "traveler" && travelerBreakdown.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/10 p-1 rounded-xl flex items-center gap-1 w-fit max-w-full overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTravelerId("all")}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${
                  selectedTravelerId === "all"
                    ? "bg-brand-500 text-white"
                    : "text-slate-500 dark:text-slate-300"
                }`}
              >
                Todos
              </button>
              {travelerBreakdown.map((traveler) => (
                <button
                  key={`filter-${traveler.user.id}`}
                  type="button"
                  onClick={() => setSelectedTravelerId(traveler.user.id)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${
                    selectedTravelerId === traveler.user.id
                      ? "bg-brand-500 text-white"
                      : "text-slate-500 dark:text-slate-300"
                  }`}
                >
                  {traveler.user.name}
                </button>
              ))}
            </div>

            <div
              className={
                selectedTravelerId === "all"
                  ? "grid grid-cols-1 xl:grid-cols-2 gap-4"
                  : "space-y-4"
              }
            >
              {visibleTravelerBreakdown.map((traveler) => (
                <div
                  key={traveler.user.id}
                  className="rounded-[1.5rem] bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black"
                        style={{ backgroundColor: traveler.user.color }}
                      >
                        {traveler.user.name.charAt(0)}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200">
                        {traveler.user.name}
                      </p>
                    </div>
                    <p className="text-[11px] font-black text-brand-500">
                      R$ {formatBRL(traveler.total)}
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {traveler.items.map((item) => (
                        <div
                          key={`${traveler.user.id}-${item.id}`}
                          className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5"
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate uppercase">
                              {item.description}
                            </p>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest truncate">
                              {item.cityName}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {item.currencyCode !== "BRL" && (
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                {item.currencySymbol}{" "}
                                {item.shareOriginalAmount.toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}{" "}
                                {item.currencyCode}
                              </p>
                            )}
                            <p className="text-[10px] font-black text-slate-800 dark:text-slate-100">
                              R$ {formatBRL(item.shareValue)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
            {breakdownMode === "city"
              ? "Sem gastos por cidade ainda"
              : breakdownMode === "category"
                ? "Sem gastos por categoria ainda"
                : "Sem gastos por viajante ainda"}
          </p>
        )}
      </div>
    </div>
  );
};
