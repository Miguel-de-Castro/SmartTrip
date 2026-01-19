
import React, { useState, useEffect } from 'react';
import { User, City, Expense, TripState, ExpenseCategory } from './types';
import { USER_COLORS, CURRENCIES, CATEGORIES } from './constants';
import { Dashboard } from './components/Dashboard';
import { Calendar } from './components/Calendar';
import { ExpenseForm } from './components/ExpenseForm';
import { PersonalSummary } from './components/PersonalSummary';
import { Settings } from './components/Settings';
import { Header } from './components/ui/Header';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'expenses' | 'division' | 'settings'>('overview');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [hideValues, setHideValues] = useState(false);

  const [state, setState] = useState<TripState>(() => {
    const saved = localStorage.getItem('vsmart_v3_state');
    if (saved) return JSON.parse(saved);

    const mockUsers = [
      { id: '1', name: 'Ana', color: USER_COLORS[0] },
      { id: '2', name: 'Bruno', color: USER_COLORS[1] },
      { id: '3', name: 'Carlos', color: USER_COLORS[3] }
    ];
    const mockCities = [
      { id: '1', name: 'Paris', country: 'França' },
      { id: '2', name: 'Roma', country: 'Itália' }
    ];
    
    const d = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString();
    };

    const mockExpenses: Expense[] = [
      { id: 'e1', description: 'Hotel Paris', amount: 800, currencyCode: 'EUR', convertedAmountBRL: 4760, date: d(0), userIds: ['1', '2'], cityId: '1', category: ExpenseCategory.STAY },
      { id: 'e2', description: 'Jantar', amount: 120, currencyCode: 'EUR', convertedAmountBRL: 714, date: d(0), userIds: ['1', '2', '3'], cityId: '1', category: ExpenseCategory.FOOD },
    ];

    return {
      users: mockUsers,
      cities: mockCities,
      expenses: mockExpenses,
      currentCurrency: 'BRL',
      totalBudgetBRL: 15000
    };
  });

  useEffect(() => {
    localStorage.setItem('vsmart_v3_state', JSON.stringify(state));
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [state, isDarkMode]);

  const handleSaveExpense = (expenseData: any) => {
    if (editingExpense) {
      const updatedExpense: Expense = { ...expenseData, id: editingExpense.id };
      setState(prev => ({
        ...prev,
        expenses: prev.expenses.map(e => e.id === editingExpense.id ? updatedExpense : e)
      }));
    } else {
      const expense: Expense = { ...expenseData, id: crypto.randomUUID() };
      setState(prev => ({ ...prev, expenses: [expense, ...prev.expenses] }));
    }
    closeExpenseForm();
  };

  const deleteExpense = (id: string) => {
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  };

  const openExpenseForm = (expense?: Expense) => {
    if (expense) setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const closeExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  const updateUsers = (users: User[]) => setState(prev => ({ ...prev, users }));
  const updateCities = (cities: City[]) => setState(prev => ({ ...prev, cities }));
  const updateBudget = (totalBudgetBRL: number) => setState(prev => ({ ...prev, totalBudgetBRL }));

  const getHeaderData = () => {
    switch(activeTab) {
      case 'overview': return { title: 'Viajante!', subtitle: 'Boa tarde,', profile: true };
      case 'calendar': return { title: 'Sua Agenda', subtitle: 'Cronograma de', profile: false };
      case 'division': return { title: 'Divisão', subtitle: 'Quem deve o que', profile: false };
      case 'expenses': return { title: 'Lançamentos', subtitle: 'Histórico de', profile: false };
      case 'settings': return { title: 'Ajustes', subtitle: 'Configurações de', profile: false };
      default: return { title: 'Ajustes', subtitle: 'Configurações de', profile: false };
    }
  };

  const header = getHeaderData();

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <Header 
        title={header.title}
        subtitle={header.subtitle}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenSettings={() => setActiveTab('settings')}
        hideValues={activeTab === 'overview' ? hideValues : undefined}
        onToggleHideValues={activeTab === 'overview' ? () => setHideValues(!hideValues) : undefined}
        showProfile={header.profile}
      />

      <main className="max-w-xl mx-auto px-4 -mt-16 pb-32 relative z-20">
        {activeTab === 'overview' && (
          <Dashboard 
            expenses={state.expenses} 
            users={state.users} 
            cities={state.cities} 
            budget={state.totalBudgetBRL}
            hideValues={hideValues}
          />
        )}

        {activeTab === 'calendar' && (
          <Calendar expenses={state.expenses} users={state.users} cities={state.cities} />
        )}

        {activeTab === 'division' && (
          <PersonalSummary expenses={state.expenses} users={state.users} cities={state.cities} />
        )}

        {activeTab === 'settings' && (
          <Settings 
            state={state} 
            onUpdateUsers={updateUsers} 
            onUpdateCities={updateCities} 
            onUpdateBudget={updateBudget} 
          />
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {state.expenses.length > 0 ? state.expenses.map(expense => {
              const cat = CATEGORIES.find(c => c.id === expense.category);
              return (
                <div key={expense.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl card-shadow border border-slate-100 dark:border-white/5 flex items-center gap-4 transition-all hover:scale-[1.01]">
                   <div className={`w-12 h-12 rounded-2xl ${cat?.bg} flex items-center justify-center ${cat?.color} shadow-sm`}>
                      <i className={`fa-solid ${cat?.icon} text-lg`}></i>
                   </div>
                   <div className="flex-1">
                      <p className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">{expense.description}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(expense.date).toLocaleDateString('pt-BR')}</p>
                   </div>
                   <div className="text-right mr-2">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        R$ {expense.convertedAmountBRL.toLocaleString('pt-BR')}
                      </p>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => openExpenseForm(expense)} className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-500 flex items-center justify-center transition-colors hover:bg-brand-100">
                       <i className="fa-solid fa-pen text-[10px]"></i>
                     </button>
                     <button onClick={() => deleteExpense(expense.id)} className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center transition-colors hover:bg-red-100">
                       <i className="fa-solid fa-trash-can text-[10px]"></i>
                     </button>
                   </div>
                </div>
              );
            }) : (
              <div className="text-center py-12 opacity-40">
                <i className="fa-solid fa-receipt text-4xl mb-4"></i>
                <p className="text-xs font-black uppercase tracking-widest">Nenhum gasto lançado</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 h-20 px-4 safe-bottom z-50">
        <div className="max-w-xl mx-auto h-full flex items-center justify-between">
          <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'overview' ? 'text-brand-500 scale-110' : 'text-slate-400 opacity-60'}`}>
            <i className="fa-solid fa-house text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tighter">Início</span>
          </button>
          <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'expenses' ? 'text-brand-500 scale-110' : 'text-slate-400 opacity-60'}`}>
            <i className="fa-solid fa-receipt text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tighter">Gastos</span>
          </button>

          <button 
            onClick={() => openExpenseForm()}
            className="w-12 h-12 bg-brand-500 text-white rounded-full shadow-lg shadow-brand-500/40 flex items-center justify-center -mt-10 border-4 border-white dark:border-slate-950 active:scale-90 transition-all hover:rotate-90"
          >
            <i className="fa-solid fa-plus text-xl"></i>
          </button>

          <button onClick={() => setActiveTab('division')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'division' ? 'text-brand-500 scale-110' : 'text-slate-400 opacity-60'}`}>
            <i className="fa-solid fa-users text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tighter">Divisão</span>
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'calendar' ? 'text-brand-500 scale-110' : 'text-slate-400 opacity-60'}`}>
            <i className="fa-solid fa-calendar-day text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tighter">Agenda</span>
          </button>
        </div>
      </nav>

      {showExpenseForm && (
        <ExpenseForm 
          users={state.users} 
          cities={state.cities} 
          onAdd={handleSaveExpense}
          onClose={closeExpenseForm}
          initialData={editingExpense || undefined}
        />
      )}
    </div>
  );
};

export default App;
