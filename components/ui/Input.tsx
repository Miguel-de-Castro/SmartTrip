
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label?: string;
  isSelect?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, isSelect, className = '', ...props }) => {
  const inputStyles = "w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-brand-500/20 border-brand-500/10 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400";
  
  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
      {isSelect ? (
        <select className={`${inputStyles} cursor-pointer appearance-none ${className}`} {...(props as any)}>
          {props.children}
        </select>
      ) : (
        <input className={`${inputStyles} ${className}`} {...(props as any)} />
      )}
    </div>
  );
};
