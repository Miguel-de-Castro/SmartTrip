import React, { useMemo } from "react";
import { Expense, User } from "../types";
import { formatBRL } from "../utils/currency";
import { formatDatePtBr } from "../utils/date";

interface DebtsProps {
  expenses: Expense[];
  users: User[];
  onTogglePaid: (
    expenseId: string,
    debtorUserId: string,
    paid: boolean,
  ) => void;
}

interface DebtItem {
  expenseId: string;
  debtorUserId: string;
  creditorUserId: string;
  amountBRL: number;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
  startTimeZoneCountry?: string;
  endTimeZoneCountry?: string;
  paid: boolean;
}

interface DebtPairTotal {
  debtorUserId: string;
  creditorUserId: string;
  amountBRL: number;
}

export const Debts: React.FC<DebtsProps> = ({
  expenses,
  users,
  onTogglePaid,
}) => {
  const debtItems = useMemo<DebtItem[]>(() => {
    const items: DebtItem[] = [];

    expenses.forEach((expense) => {
      const participants: string[] = Array.from(
        new Set(
          expense.payerUserId && !expense.userIds.includes(expense.payerUserId)
            ? [...expense.userIds, expense.payerUserId]
            : expense.userIds,
        ),
      ).filter((userId): userId is string => typeof userId === "string");

      if (participants.length <= 1) return;

      const payerUserId = expense.payerUserId || participants[0];
      const settledSet = new Set(expense.settledUserIds || []);
      const share = expense.convertedAmountBRL / participants.length;

      participants.forEach((participantId) => {
        if (participantId === payerUserId) return;

        items.push({
          expenseId: expense.id,
          debtorUserId: participantId,
          creditorUserId: payerUserId,
          amountBRL: share,
          description: expense.description,
          date: expense.date,
          startTime: expense.startTime || expense.time,
          endTime: expense.endTime,
          startTimeZoneCountry: expense.startTimeZoneCountry,
          endTimeZoneCountry: expense.endTimeZoneCountry,
          paid: settledSet.has(participantId),
        });
      });
    });

    return items.sort((a, b) => {
      if (a.paid !== b.paid) return a.paid ? 1 : -1;
      const aTime = (a.startTime || "").trim();
      const bTime = (b.startTime || "").trim();

      if (aTime !== bTime) {
        if (!aTime) return -1;
        if (!bTime) return 1;
        return aTime.localeCompare(bTime);
      }
      return a.date.localeCompare(b.date);
    });
  }, [expenses]);

  const openTotal = useMemo(() => {
    return debtItems
      .filter((item) => !item.paid)
      .reduce((sum, item) => sum + item.amountBRL, 0);
  }, [debtItems]);

  const pairTotals = useMemo<DebtPairTotal[]>(() => {
    const balanceByPair = new Map<string, number>();

    debtItems
      .filter((item) => !item.paid)
      .forEach((item) => {
        const pair = [item.debtorUserId, item.creditorUserId].sort();
        const [firstUserId, secondUserId] = pair;
        const pairKey = `${firstUserId}|${secondUserId}`;
        const previousBalance = balanceByPair.get(pairKey) || 0;

        const signedAmount =
          item.debtorUserId === firstUserId ? item.amountBRL : -item.amountBRL;

        balanceByPair.set(pairKey, previousBalance + signedAmount);
      });

    const netPairs: DebtPairTotal[] = [];

    balanceByPair.forEach((balance, pairKey) => {
      if (Math.abs(balance) < 0.005) return;

      const [firstUserId, secondUserId] = pairKey.split("|");

      if (balance > 0) {
        netPairs.push({
          debtorUserId: firstUserId,
          creditorUserId: secondUserId,
          amountBRL: balance,
        });
        return;
      }

      netPairs.push({
        debtorUserId: secondUserId,
        creditorUserId: firstUserId,
        amountBRL: Math.abs(balance),
      });
    });

    return netPairs.sort((a, b) => b.amountBRL - a.amountBRL);
  }, [debtItems]);

  const getUserName = (userId: string) =>
    users.find((u) => u.id === userId)?.name || "Usuário";

  if (debtItems.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-100 dark:border-white/5 text-center">
          <i className="fa-solid fa-handshake text-3xl text-brand-500 mb-4"></i>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Nenhuma dívida entre participantes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 xl:space-y-0 xl:grid xl:grid-cols-3 xl:gap-6 xl:items-start">
      <div className="space-y-6 xl:col-span-1 xl:sticky xl:top-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 card-shadow border border-slate-100 dark:border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Total em aberto
          </p>
          <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
            R$ {formatBRL(openTotal)}
          </h3>
        </div>

        {pairTotals.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 card-shadow border border-slate-100 dark:border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Resumo Geral
            </p>
            <div className="space-y-3">
              {pairTotals.map((pair) => (
                <div
                  key={`${pair.debtorUserId}-${pair.creditorUserId}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5"
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {getUserName(pair.debtorUserId)} →{" "}
                    {getUserName(pair.creditorUserId)}
                  </p>
                  <p className="text-[11px] font-black text-brand-500">
                    R$ {formatBRL(pair.amountBRL)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 px-1 xl:col-span-2 xl:px-0 xl:max-h-[75vh] xl:overflow-y-auto xl:pr-1">
        {debtItems.map((item) => {
          const debtorName = getUserName(item.debtorUserId);
          const creditorName = getUserName(item.creditorUserId);

          return (
            <div
              key={`${item.expenseId}:${item.debtorUserId}`}
              className={`bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-3 ${item.paid ? "opacity-60" : ""}`}
            >
              <input
                type="checkbox"
                checked={item.paid}
                onChange={(event) =>
                  onTogglePaid(
                    item.expenseId,
                    item.debtorUserId,
                    event.target.checked,
                  )
                }
                className="w-4 h-4 rounded accent-brand-500"
              />

              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate">
                  {debtorName} deve para {creditorName}
                </p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">
                  {item.description}
                </p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Evento: {formatDatePtBr(item.date)}{" "}
                  {item.startTime
                    ? [
                        `• Início ${item.startTime}`,
                        item.startTimeZoneCountry
                          ? `(${item.startTimeZoneCountry})`
                          : "",
                        item.endTime ? `• Fim ${item.endTime}` : "",
                        item.endTime && item.endTimeZoneCountry
                          ? `(${item.endTimeZoneCountry})`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    : "• sem horário"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-black text-brand-500">
                  R$ {formatBRL(item.amountBRL)}
                </p>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  {item.paid ? "Pago" : "Em aberto"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
