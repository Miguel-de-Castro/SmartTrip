import React, { useMemo, useState } from "react";
import { Expense, User, City } from "../types";
import { DEFAULT_CATEGORIES } from "../constants";
import { formatBRL } from "../utils/currency";
import {
  dateKeyFromLocalDate,
  dateKeyToLocalDate,
  extractDateKey,
} from "../utils/date";

interface CalendarProps {
  expenses: Expense[];
  users: User[];
  cities: City[];
  categories: { id: string; icon: string; color: string; bg: string }[];
}

export const Calendar: React.FC<CalendarProps> = ({
  expenses,
  users,
  cities,
  categories,
}) => {
  const isExpenseOnDay = (expense: Expense, dayKey: string) => {
    const startKey = extractDateKey(expense.date);
    if (!startKey) return false;

    const rawEndKey = extractDateKey(expense.endDate);
    const endKey = rawEndKey || startKey;

    const rangeStart = startKey <= endKey ? startKey : endKey;
    const rangeEnd = startKey <= endKey ? endKey : startKey;

    return dayKey >= rangeStart && dayKey <= rangeEnd;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (expenses.length > 0) {
      const firstDateKey = extractDateKey(expenses[0].date);
      if (firstDateKey) return dateKeyToLocalDate(firstDateKey);
    }
    return new Date();
  });

  const calendarDays = useMemo(() => {
    const start = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1,
    );
    const end = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0,
    );

    const days = [];
    const firstDayOfWeek = start.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= end.getDate(); d++) {
      const date = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        d,
      );
      const dayKey = dateKeyFromLocalDate(date);
      const dayExpenses = expenses.filter((e) => isExpenseOnDay(e, dayKey));
      days.push({ date, expenses: dayExpenses });
    }

    return days;
  }, [selectedDate, expenses]);

  const selectedDayExpenses = useMemo(() => {
    const selectedDayKey = dateKeyFromLocalDate(selectedDate);

    return expenses
      .filter((e) => isExpenseOnDay(e, selectedDayKey))
      .sort((a, b) => {
        const aTime = (a.startTime || a.time || "").trim();
        const bTime = (b.startTime || b.time || "").trim();

        if (!aTime && !bTime) return 0;
        if (!aTime) return -1;
        if (!bTime) return 1;

        return aTime.localeCompare(bTime);
      });
  }, [selectedDate, expenses]);

  const selectedWeekdayLabel = useMemo(() => {
    return selectedDate
      .toLocaleDateString("pt-BR", { weekday: "long" })
      .toUpperCase();
  }, [selectedDate]);

  const hourRows = useMemo(() => {
    return Array.from({ length: 16 }, (_, index) =>
      `${7 + index}`.padStart(2, "0"),
    );
  }, []);

  const eventsByHour = useMemo(() => {
    const map: Record<string, Expense[]> = {};

    hourRows.forEach((hour) => {
      map[hour] = [];
    });

    selectedDayExpenses.forEach((expense) => {
      const eventTime = expense.startTime || expense.time;
      const hourKey = eventTime?.split(":")[0];
      if (hourKey && map[hourKey]) {
        map[hourKey].push(expense);
      }
    });

    return map;
  }, [hourRows, selectedDayExpenses]);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  void cities;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700 xl:space-y-0 xl:grid xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:gap-6 xl:items-start">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-6 card-shadow border border-white dark:border-white/5 xl:h-full">
        <div className="flex justify-between items-center mb-8 px-2">
          <div>
            <p className="text-[9px] font-black text-brand-500 uppercase tracking-[0.3em] mb-1">
              Calendário de Gastos
            </p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white capitalize">
              {selectedDate.toLocaleString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)),
                )
              }
              className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-brand-500 transition-colors"
            >
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)),
                )
              }
              className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 hover:text-brand-500 transition-colors"
            >
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-4">
          {weekDays.map((d) => (
            <div
              key={d}
              className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest py-2"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, i) => {
            if (!day)
              return <div key={`empty-${i}`} className="aspect-square"></div>;

            const isSelected =
              day.date.toDateString() === selectedDate.toDateString();
            const hasExpenses = day.expenses.length > 0;
            const isToday =
              day.date.toDateString() === new Date().toDateString();

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(new Date(day.date))}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 border ${
                  isSelected
                    ? "bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/40 scale-110 z-10"
                    : "bg-white dark:bg-slate-800/50 border-slate-50 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-brand-500/30"
                }`}
              >
                <span
                  className={`text-xs font-black ${isToday && !isSelected ? "text-brand-500 underline underline-offset-4" : ""}`}
                >
                  {day.date.getDate()}
                </span>
                {hasExpenses && (
                  <div
                    className={`absolute bottom-2 w-1 h-1 rounded-full ${isSelected ? "bg-white shadow-[0_0_8px_white]" : "bg-brand-500 animate-pulse"}`}
                  ></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4 px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {selectedDate.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                })}
              </h4>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm border border-slate-50 dark:border-white/5">
              R${" "}
              {formatBRL(
                selectedDayExpenses.reduce(
                  (acc, curr) => acc + curr.convertedAmountBRL,
                  0,
                ),
              )}
            </span>
          </div>

          {selectedDayExpenses.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {selectedDayExpenses.map((exp) => {
                const cat =
                  categories.find((c) => c.id === exp.category) ||
                  DEFAULT_CATEGORIES.find((c) => c.id === "Outros");

                return (
                  <div
                    key={exp.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-50 dark:border-white/5 flex items-center gap-4 animate-in slide-in-from-right-4 card-shadow"
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl ${cat?.bg} flex items-center justify-center ${cat?.color} shadow-sm`}
                    >
                      <i className={`fa-solid ${cat?.icon}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate">
                        {exp.description}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {exp.startTime || exp.time || exp.endTime
                          ? [
                              `Início: ${exp.startTime || exp.time || "--:--"}`,
                              exp.startTimeZoneCountry
                                ? `(${exp.startTimeZoneCountry})`
                                : "",
                              `• Fim: ${exp.endTime || "--:--"}`,
                              exp.endTimeZoneCountry
                                ? `(${exp.endTimeZoneCountry})`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")
                          : "Sem horário"}
                      </p>
                      <div className="flex -space-x-1 mt-1.5">
                        {exp.userIds.map((uid) => (
                          <div
                            key={uid}
                            className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                            style={{
                              backgroundColor: users.find((u) => u.id === uid)
                                ?.color,
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        R$ {formatBRL(exp.convertedAmountBRL)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-[2.5rem] py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
              <i className="fa-solid fa-calendar-day text-slate-200 dark:text-slate-800 text-4xl mb-4"></i>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nenhum gasto neste dia
              </p>
            </div>
          )}
        </div>

        <div className="px-2">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="grid grid-cols-[72px_1fr] bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-white/5">
              <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Hora
              </div>
              <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {selectedWeekdayLabel}
              </div>
            </div>

            {hourRows.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[72px_1fr] border-b last:border-b-0 border-slate-100 dark:border-white/5"
              >
                <div className="px-4 py-2.5 text-[11px] font-bold text-slate-400">
                  {hour}:00
                </div>
                <div className="px-3 py-1.5 min-h-[40px] flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {(eventsByHour[hour] || []).length > 0 ? (
                    eventsByHour[hour].map((expense) => (
                      <span
                        key={`hour-${hour}-${expense.id}`}
                        className="shrink-0 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      >
                        {expense.startTime || expense.time || "--:--"} •{" "}
                        {expense.description}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-300 dark:text-slate-700">
                      —
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
