
import React, { useState } from 'react';
import { User, City, TripState } from '../types';
import { USER_COLORS } from '../constants';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface SettingsProps {
  state: TripState;
  onUpdateUsers: (users: User[]) => void;
  onUpdateCities: (cities: City[]) => void;
  onUpdateBudget: (budget: number) => void;
}

export const Settings: React.FC<SettingsProps> = ({ state, onUpdateUsers, onUpdateCities, onUpdateBudget }) => {
  const [newUserName, setNewUserName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newCountryName, setNewCountryName] = useState('');

  const handleAddUser = () => {
    if (!newUserName.trim()) return;
    const newUser: User = {
      id: crypto.randomUUID(),
      name: newUserName.trim(),
      color: USER_COLORS[state.users.length % USER_COLORS.length]
    };
    onUpdateUsers([...state.users, newUser]);
    setNewUserName('');
  };

  const handleRemoveUser = (id: string) => {
    if (state.users.length <= 1) return;
    onUpdateUsers(state.users.filter(u => u.id !== id));
  };

  const handleAddCity = () => {
    if (!newCityName.trim() || !newCountryName.trim()) return;
    const newCity: City = {
      id: crypto.randomUUID(),
      name: newCityName.trim(),
      country: newCountryName.trim()
    };
    onUpdateCities([...state.cities, newCity]);
    setNewCityName('');
    setNewCountryName('');
  };

  const handleRemoveCity = (id: string) => {
    if (state.cities.length <= 1) return;
    onUpdateCities(state.cities.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Seção de Orçamento */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-piggy-bank text-brand-500"></i>
          Meta de Gastos
        </h3>
        <div className="space-y-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Limite total para a viagem (R$)</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">R$</span>
            <input 
              type="number" 
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xl font-black text-slate-900 dark:text-white outline-none focus:ring-2 ring-brand-500/20"
              value={state.totalBudgetBRL}
              onChange={(e) => onUpdateBudget(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Seção de Viajantes */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-users text-brand-500"></i>
          Viajantes
        </h3>
        
        <div className="grid grid-cols-1 gap-3 mb-6">
          {state.users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: u.color }}>
                  {u.name.charAt(0)}
                </div>
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase">{u.name}</span>
              </div>
              <button onClick={() => handleRemoveUser(u.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Nome do viajante..." 
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 text-[11px] font-bold outline-none"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
          />
          <Button size="sm" onClick={handleAddUser} icon="fa-plus">Add</Button>
        </div>
      </div>

      {/* Seção de Destinos */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-earth-americas text-brand-500"></i>
          Destinos
        </h3>

        <div className="grid grid-cols-1 gap-3 mb-6">
          {state.cities.map(c => (
            <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-location-dot text-brand-500 text-xs"></i>
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">{c.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.country}</p>
                </div>
              </div>
              <button onClick={() => handleRemoveCity(c.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="text" 
              placeholder="Cidade" 
              className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 text-[11px] font-bold outline-none"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="País" 
              className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 text-[11px] font-bold outline-none"
              value={newCountryName}
              onChange={(e) => setNewCountryName(e.target.value)}
            />
          </div>
          <Button className="w-full" variant="secondary" size="sm" onClick={handleAddCity} icon="fa-plus">Adicionar Destino</Button>
        </div>
      </div>
      
      <div className="text-center pb-8">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">ViagemSmart v3.0 • Feito para você</p>
      </div>
    </div>
  );
};
