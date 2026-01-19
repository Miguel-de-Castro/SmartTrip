
import React, { useMemo } from 'react';
import { Expense, User, City } from '../types';

interface DashboardProps {
  expenses: Expense[];
  users: User[];
  cities: City[];
  budget: number;
  hideValues: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses, users, cities, budget, hideValues }) => {
  const totalBRL = useMemo(() => expenses.reduce((acc, curr) => acc + curr.convertedAmountBRL, 0), [expenses]);
  const budgetProgress = Math.min((totalBRL / budget) * 100, 100);

  const userData = useMemo(() => {
    return users.map(user => {
      const value = expenses.reduce((acc, curr) => {
        if (curr.userIds.includes(user.id)) {
          return acc + (curr.convertedAmountBRL / curr.userIds.length);
        }
        return acc;
      }, 0);
      return { ...user, value };
    });
  }, [expenses, users]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Saldo Geral Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Consumido</p>
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
          {hideValues ? 'R$ ••••••' : `R$ ${totalBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        </h2>
        
        <div className="mt-10 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Limite de Orçamento</span>
            <span className="text-[11px] font-black text-brand-500 uppercase">{budgetProgress.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,200,110,0.3)]"
              style={{ width: `${budgetProgress}%` }}
            ></div>
          </div>
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Meta de Gastos: R$ {budget.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Participações por Pessoa */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Meus Saldos</h3>
        <div className="space-y-6">
          {userData.map(user => (
            <div key={user.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-[10px] font-black shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: user.color }}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-white leading-none mb-1.5">{user.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Conta Individual</p>
                </div>
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                {hideValues ? 'R$ ••••' : `R$ ${user.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
              </p>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-10 py-4 bg-slate-50 dark:bg-slate-800/50 text-brand-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-3xl hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all border border-transparent hover:border-brand-500/20">
          Ajustar Saldos
        </button>
      </div>

      {/* City/Category Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] card-shadow flex flex-col items-center text-center gap-3 border border-slate-50 dark:border-white/5">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/30 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner">
              <i className="fa-solid fa-plane-departure text-xl"></i>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Passagens</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">R$ 1.250</p>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] card-shadow flex flex-col items-center text-center gap-3 border border-slate-50 dark:border-white/5">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
              <i className="fa-solid fa-bed text-xl"></i>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hotéis</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">R$ 4.760</p>
            </div>
         </div>
      </div>
    </div>
  );
};
