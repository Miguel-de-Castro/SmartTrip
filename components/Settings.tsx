import React, { useState } from "react";
import { User, City, TripState, CategoryOption } from "../types";
import { USER_COLORS } from "../constants";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface SettingsProps {
  state: TripState;
  onUpdateUsers: (users: User[]) => void;
  onUpdateCities: (cities: City[]) => void;
  onUpdateCategories: (categories: CategoryOption[]) => void;
  onUpdateBudget: (budget: number) => void;
  onReloadFromJson: () => Promise<boolean>;
}

export const Settings: React.FC<SettingsProps> = ({
  state,
  onUpdateUsers,
  onUpdateCities,
  onUpdateCategories,
  onUpdateBudget,
  onReloadFromJson,
}) => {
  const [newUserName, setNewUserName] = useState("");
  const [newCityName, setNewCityName] = useState("");
  const [newCountryName, setNewCountryName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isReloading, setIsReloading] = useState(false);
  const [reloadFeedback, setReloadFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleAddUser = () => {
    if (!newUserName.trim()) return;
    const newUser: User = {
      id: crypto.randomUUID(),
      name: newUserName.trim(),
      color: USER_COLORS[state.users.length % USER_COLORS.length],
    };
    onUpdateUsers([...state.users, newUser]);
    setNewUserName("");
  };

  const handleRemoveUser = (id: string) => {
    if (state.users.length <= 1) return;
    onUpdateUsers(state.users.filter((u) => u.id !== id));
  };

  const handleAddCity = () => {
    if (!newCityName.trim() || !newCountryName.trim()) return;
    const newCity: City = {
      id: crypto.randomUUID(),
      name: newCityName.trim(),
      country: newCountryName.trim(),
    };
    onUpdateCities([...state.cities, newCity]);
    setNewCityName("");
    setNewCountryName("");
  };

  const handleRemoveCity = (id: string) => {
    if (state.cities.length <= 1) return;
    onUpdateCities(state.cities.filter((c) => c.id !== id));
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (state.categories.some((category) => category.id === name)) return;

    const newCategory: CategoryOption = {
      id: name,
      icon: "fa-tag",
      color: "text-slate-500",
      bg: "bg-slate-500/10",
    };

    onUpdateCategories([...state.categories, newCategory]);
    setNewCategoryName("");
  };

  const handleRemoveCategory = (id: string) => {
    if (state.categories.length <= 1) return;
    onUpdateCategories(
      state.categories.filter((category) => category.id !== id),
    );
  };

  const handleReloadFromJson = async () => {
    setIsReloading(true);
    try {
      const ok = await onReloadFromJson();
      setReloadFeedback(
        ok
          ? { type: "success", message: "Dados recarregados do JSON." }
          : { type: "error", message: "Não foi possível recarregar o JSON." },
      );
    } finally {
      setIsReloading(false);
      setTimeout(() => setReloadFeedback(null), 2500);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-8">
      {/* Seção de Orçamento */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5 xl:col-span-2">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-piggy-bank text-brand-500"></i>
          Meta de Gastos
        </h3>
        <div className="mb-4">
          <Button
            className="w-full"
            variant="outline"
            size="sm"
            icon="fa-rotate"
            isLoading={isReloading}
            onClick={handleReloadFromJson}
          >
            Recarregar do JSON
          </Button>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Limite total para a viagem (R$)
          </p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
              R$
            </span>
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
          {state.users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                  style={{ backgroundColor: u.color }}
                >
                  {u.name.charAt(0)}
                </div>
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase">
                  {u.name}
                </span>
              </div>
              <button
                onClick={() => handleRemoveUser(u.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-2"
              >
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
            onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
          />
          <Button size="sm" onClick={handleAddUser} icon="fa-plus">
            Add
          </Button>
        </div>
      </div>

      {/* Seção de Destinos */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-earth-americas text-brand-500"></i>
          Destinos
        </h3>

        <div className="grid grid-cols-1 gap-3 mb-6">
          {state.cities.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-location-dot text-brand-500 text-xs"></i>
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">
                    {c.name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {c.country}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveCity(c.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-2"
              >
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
          <Button
            className="w-full"
            variant="secondary"
            size="sm"
            onClick={handleAddCity}
            icon="fa-plus"
          >
            Adicionar Destino
          </Button>
        </div>
      </div>

      {/* Seção de Categorias */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 card-shadow border border-slate-50 dark:border-white/5">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-tags text-brand-500"></i>
          Categorias
        </h3>

        <div className="grid grid-cols-1 gap-3 mb-6">
          {state.categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${category.bg} ${category.color}`}
                >
                  <i className={`fa-solid ${category.icon} text-xs`}></i>
                </div>
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase">
                  {category.id}
                </span>
              </div>
              <button
                onClick={() => handleRemoveCategory(category.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-2"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome da categoria..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 text-[11px] font-bold outline-none"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          />
          <Button size="sm" onClick={handleAddCategory} icon="fa-plus">
            Add
          </Button>
        </div>
      </div>

      <div className="text-center pb-8 xl:col-span-2">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">
          ViagemSmart v3.0 • Feito para você
        </p>
      </div>

      {reloadFeedback && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 px-4 pointer-events-none">
          <div
            className={`rounded-2xl px-4 py-2 border text-[10px] font-black uppercase tracking-wider backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              reloadFeedback.type === "success"
                ? "bg-white/95 dark:bg-slate-900/95 text-brand-500 border-brand-500/20"
                : "bg-white/95 dark:bg-slate-900/95 text-red-500 border-red-500/20"
            }`}
          >
            {reloadFeedback.message}
          </div>
        </div>
      )}
    </div>
  );
};
