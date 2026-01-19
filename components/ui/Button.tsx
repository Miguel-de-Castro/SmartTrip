
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/10",
    secondary: "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/5",
    outline: "border border-slate-200 dark:border-white/10 hover:border-brand-500 text-slate-600 dark:text-slate-400 hover:text-brand-600",
    ghost: "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500",
    danger: "bg-amber-600/5 hover:bg-amber-600 text-amber-600 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px] uppercase tracking-wider",
    md: "px-5 py-2 text-xs uppercase tracking-wider",
    lg: "px-7 py-2.5 text-sm uppercase tracking-wider"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : icon && <i className={`fa-solid ${icon}`}></i>}
      {children}
    </button>
  );
};
