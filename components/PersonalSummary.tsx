
import React, { useMemo, useState } from 'react';
import { Expense, User, City, ExpenseCategory } from '../types';
import { CATEGORIES } from '../constants';
import { Badge } from './ui/Badge';

interface PersonalSummaryProps {
  expenses: Expense[];
  users: User[];
  cities: City[];
}

export const PersonalSummary: React.FC<PersonalSummaryProps> = ({ expenses, users, cities }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');

  const userSummaries = useMemo(() => {
    return users.map(user => {
      const participations = expenses.filter(e => e.userIds.includes(user.id));
      const totalIndividual = participations.reduce((acc, curr) => {
        return acc + (curr.convertedAmountBRL / curr.userIds.length);
      }, 0);

      const categoryTotals = Object.values(ExpenseCategory).map(cat => {
        const total = participations
          .filter(e => e.category === cat)
          .reduce((acc, curr) => acc + (curr.convertedAmountBRL / curr.userIds.length), 0);
        return { category: cat, total };
      }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

      return {
        ...user,
        totalIndividual,
        count: participations.length,
        items: participations,
        categoryTotals
      };
    });
  }, [expenses, users]);

  const activeUser = userSummaries.find(u => u.id === selectedUserId) || userSummaries[0];

  if (!activeUser) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Container Principal abaixo do Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 card-shadow border border-slate-100 dark:border-white/5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2">Quem você quer ver?</h3>
        
        {/* Seletor de Usuário Estilo "Tabs Modernas" */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1 mb-8">
          {userSummaries.map(u => (
            <button
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all shrink-0 border-2 ${
                selectedUserId === u.id
                  ? 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400'
                  : 'border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400'
              }`}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ backgroundColor: u.color }}>
                {u.name.charAt(0)}
              </div>
              <span className="text-[11px] font-black uppercase tracking-tight">{u.name}</span>
            </button>
          ))}
        </div>

        {/* Resumo do Usuário Ativo */}
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-end px-2">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total acumulado</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                R$ {activeUser.totalIndividual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="text-right">
              <Badge variant="brand" className="text-[10px] py-1 px-3 rounded-xl">{activeUser.count} transações</Badge>
            </div>
          </div>

          {/* Gráfico de Categorias */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Distribuição de Gastos</p>
            <div className="grid grid-cols-1 gap-4">
              {activeUser.categoryTotals.map(ct => {
                const catInfo = CATEGORIES.find(c => c.id === ct.category);
                const percentage = (ct.total / activeUser.totalIndividual) * 100;
                return (
                  <div key={ct.category} className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <i className={`fa-solid ${catInfo?.icon} ${catInfo?.color} text-[10px]`}></i>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{ct.category}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white">R$ {ct.total.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%`, backgroundColor: catInfo?.color.replace('text-', '') === 'brand-500' ? '#10c86e' : catInfo?.color.replace('text-', '') }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Listagem de Itens (Fora do card de resumo para melhor scroll) */}
      <div className="space-y-3 px-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Linha do tempo de {activeUser.name}</p>
        {activeUser.items.map(expense => {
          const cat = CATEGORIES.find(c => c.id === expense.category);
          const myPart = expense.convertedAmountBRL / expense.userIds.length;
          return (
            <div key={expense.id} className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-50 dark:border-white/5 flex items-center gap-4 transition-transform active:scale-95">
              <div className={`w-10 h-10 rounded-2xl ${cat?.bg} flex items-center justify-center ${cat?.color} shrink-0`}>
                <i className={`fa-solid ${cat?.icon}`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-black text-slate-800 dark:text-white truncate uppercase">{expense.description}</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(expense.date).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-brand-500">R$ {myPart.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                {expense.userIds.length > 1 && <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Sua parte</p>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
