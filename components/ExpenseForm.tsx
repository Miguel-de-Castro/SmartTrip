
import React, { useState, useEffect } from 'react';
import { User, City, ExpenseCategory, Expense } from '../types';
import { CURRENCIES, CATEGORIES } from '../constants';
import { parseSmartExpense } from '../services/geminiService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ExpenseFormProps {
  users: User[];
  cities: City[];
  onAdd: (expense: any) => void;
  onClose: () => void;
  initialData?: Expense;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ users, cities, onAdd, onClose, initialData }) => {
  const isEditing = !!initialData;
  
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [currencyCode, setCurrencyCode] = useState(initialData?.currencyCode || 'BRL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    initialData?.userIds || (users.length > 0 ? [users[0].id] : [])
  );
  const [cityId, setCityId] = useState(initialData?.cityId || cities[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category || ExpenseCategory.OTHER);
  const [date, setDate] = useState(
    initialData?.date 
      ? new Date(initialData.date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : ''
  );
  const [isSmartLoading, setIsSmartLoading] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [showPeriod, setShowPeriod] = useState(!!initialData?.endDate);

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(uid => uid !== id) : prev) 
        : [...prev, id]
    );
  };

  const handleSmartParse = async () => {
    if (!smartInput) return;
    setIsSmartLoading(true);
    const result = await parseSmartExpense(smartInput);
    if (result) {
      setDescription(result.description || '');
      setAmount(result.amount?.toString() || '');
      setCurrencyCode(result.currencyCode || 'BRL');
      if (result.category) {
          const cat = Object.values(ExpenseCategory).find(c => c === result.category);
          if (cat) setCategory(cat);
      }
    }
    setIsSmartLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || selectedUserIds.length === 0 || !cityId) return;
    const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
    const numericAmount = parseFloat(amount);
    onAdd({
      description,
      amount: numericAmount,
      currencyCode,
      convertedAmountBRL: numericAmount * currency.rateToBRL,
      userIds: selectedUserIds,
      cityId,
      category,
      date: new Date(date).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <h2 className="text-xl font-black tracking-tighter">
            {isEditing ? 'Editar Gasto' : 'Novo Gasto'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} icon="fa-xmark" className="rounded-full w-8 h-8 p-0" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {!isEditing && (
            <div className="bg-brand-500/5 border border-brand-500/10 p-4 rounded-3xl space-y-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles text-brand-500 text-[10px]"></i>
                <label className="text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em]">IA Smart Input</label>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Ex: Aluguel do carro 200 EUR dividido por todos"
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:ring-2 ring-brand-500/10 outline-none transition-all"
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                />
                <Button type="button" size="sm" isLoading={isSmartLoading} onClick={handleSmartParse} icon="fa-bolt" className="rounded-xl px-4" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Descrição" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Ex: Hotel ou Almoço" />
            </div>
            
            <div className="col-span-2 space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Quem pagou / Dividiu?</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {users.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                      selectedUserIds.includes(u.id)
                        ? 'border-brand-500 bg-brand-500/5 text-brand-600'
                        : 'border-slate-100 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: u.color }}></div>
                    <span className="text-[10px] font-black uppercase tracking-tight truncate">{u.name}</span>
                    {selectedUserIds.includes(u.id) && <i className="fa-solid fa-circle-check text-[10px] ml-auto"></i>}
                  </button>
                ))}
              </div>
            </div>

            <Input label="Valor Total" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
            <Input label="Moeda" isSelect value={currencyCode} onChange={e => setCurrencyCode(e.target.value)}>
               {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
            </Input>
            
            <div className="col-span-2">
              <Input label="Local da Despesa" isSelect value={cityId} onChange={e => setCityId(e.target.value)}>
                 {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Input>
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data ou Período</label>
                 <button 
                  type="button" 
                  onClick={() => setShowPeriod(!showPeriod)}
                  className={`text-[9px] font-black uppercase tracking-widest ${showPeriod ? 'text-brand-600' : 'text-slate-400'}`}
                 >
                   {showPeriod ? 'Usar data única' : '+ Adicionar fim (período)'}
                 </button>
              </div>
              <div className="flex gap-3">
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                {showPeriod && (
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="Até..." />
                )}
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                      category === cat.id 
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600' 
                        : 'border-slate-100 dark:border-slate-800 text-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <i className={`fa-solid ${cat.icon} text-[10px]`}></i>
                    <span className="text-[9px] font-black uppercase tracking-wider">{cat.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={onClose} type="button">Cancelar</Button>
            <Button variant="primary" size="md" className="flex-1" type="submit">
              {isEditing ? 'Salvar Alterações' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
